import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  GoogleMap, 
  Marker, 
  Polygon,
  Polyline,
  useJsApiLoader,
  OverlayView
} from '@react-google-maps/api';
import { useDeliveryStore } from '@/modules/DeliveryV2/store/useDeliveryStore';
import { calculateHeading } from '@/modules/DeliveryV2/utils/geo';
import { zoneAPI } from '@food/api';
import { getRoute, hasMovedSignificantly } from '@/utils/getRoute';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  inset: 0
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: true,
  fullscreenControl: false,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#FBF3EA" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#FBF3EA" }] },
    { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }
  ]
};
const LIBRARIES = ['places', 'geometry'];
const DELIVERY_GOOGLE_MAPS_API_KEY = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '')
  .trim()
  .replace(/^['"]|['"]$/g, '');

const LiveMapWithApiKey = ({ googleMapsApiKey, onMapClick, onMapLoad, onPathReceived, onPolylineReceived, zoom = 12 }) => {
  const { riderLocation, activeOrder, tripStatus } = useDeliveryStore();
  
  const { isLoaded, loadError } = useJsApiLoader(
    {
      id: 'delivery-live-map',
      googleMapsApiKey,
      libraries: LIBRARIES,
    }
  );

  const [routeData, setRouteData] = useState(null);
  const [baselineRouteData, setBaselineRouteData] = useState(null);
  const [map, setMapInternal] = useState(null);
  const [zones, setZones] = useState([]);
  const lastOriginRef = useRef(null);
  const lastRouteFetchTimeRef = useRef(0);

  const handleMapLoad = (mapInstance) => {
    mapInstance.setOptions({
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: true, // Enabled for front-view navigation
      fullscreenControl: false,
      tilt: 45, // 3D Perspective
    });
    setMapInternal(mapInstance);
    if (onMapLoad) onMapLoad(mapInstance);
  };

  useEffect(() => {
    setRouteData(null);
    setBaselineRouteData(null);
    lastOriginRef.current = null;
    lastRouteFetchTimeRef.current = 0;
  }, [tripStatus, activeOrder?._id]);

  const parsePoint = useCallback((raw) => {
    if (!raw) return null;

    const nestedLocation = raw.location && typeof raw.location === 'object' ? raw.location : null;
    const locationCandidate = nestedLocation || raw;

    const coords = Array.isArray(locationCandidate?.coordinates)
      ? locationCandidate.coordinates
      : Array.isArray(locationCandidate?.location?.coordinates)
        ? locationCandidate.location.coordinates
        : null;

    if (coords?.length >= 2) {
      const lng = parseFloat(coords[0]);
      const lat = parseFloat(coords[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }

    const lat = parseFloat(
      locationCandidate?.lat ??
      locationCandidate?.latitude ??
      locationCandidate?.location?.lat ??
      locationCandidate?.location?.latitude
    );
    const lng = parseFloat(
      locationCandidate?.lng ??
      locationCandidate?.longitude ??
      locationCandidate?.location?.lng ??
      locationCandidate?.location?.longitude
    );

    return (Number.isFinite(lat) && Number.isFinite(lng)) ? { lat, lng } : null;
  }, []);

  const restaurantPoint = useMemo(
    () => parsePoint(activeOrder?.restaurantLocation) || parsePoint(activeOrder?.restaurantId) || parsePoint(activeOrder?.restaurant),
    [activeOrder?.restaurantLocation, activeOrder?.restaurantId, activeOrder?.restaurant, parsePoint],
  );
  const customerPoint = useMemo(
    () =>
      parsePoint(activeOrder?.customerLocation) ||
      parsePoint(activeOrder?.deliveryAddress) ||
      parsePoint(activeOrder?.customer_address) ||
      parsePoint(activeOrder?.user),
    [activeOrder?.customerLocation, activeOrder?.deliveryAddress, activeOrder?.customer_address, activeOrder?.user, parsePoint],
  );

  const targetLocation = useMemo(() => {
    if (!activeOrder) return null;
    if (tripStatus === 'PICKING_UP' || tripStatus === 'REACHED_PICKUP') {
      return restaurantPoint;
    }
    if (tripStatus === 'PICKED_UP' || tripStatus === 'REACHED_DROP') {
      return customerPoint;
    }
    return null;
  }, [activeOrder, tripStatus, restaurantPoint, customerPoint]);

  const activePath = useMemo(() => {
    return routeData?.path || baselineRouteData?.path || [];
  }, [routeData?.path, baselineRouteData?.path]);

  const parsedRiderLocation = useMemo(() => {
    if (!riderLocation) return null;
    const lat = parseFloat(riderLocation.lat || riderLocation.latitude);
    const lng = parseFloat(riderLocation.lng || riderLocation.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    let head = parseFloat(riderLocation.heading || 0);
    if ((!head || head === 0) && activePath.length > 1) {
      let minDist = Infinity;
      let closestIdx = 0;
      for (let i = 0; i < activePath.length; i++) {
        const pt = activePath[i];
        const dLat = (pt.lat - lat) * 111000;
        const dLng = (pt.lng - lng) * 111000 * Math.cos((lat * Math.PI) / 180);
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }
      const nextPt = activePath[closestIdx < activePath.length - 1 ? closestIdx + 1 : closestIdx];
      const prevPt = activePath[closestIdx < activePath.length - 1 ? closestIdx : Math.max(0, closestIdx - 1)];
      if (prevPt && nextPt && (prevPt.lat !== nextPt.lat || prevPt.lng !== nextPt.lng)) {
        head = calculateHeading(prevPt.lat, prevPt.lng, nextPt.lat, nextPt.lng);
      }
    }
    return { lat, lng, heading: head };
  }, [riderLocation, activePath]);

  useEffect(() => { if (map) map.setZoom(zoom); }, [zoom, map]);

  const isOffCurrentRoute = useMemo(() => {
    if (!activePath.length || !parsedRiderLocation || !window.google?.maps?.geometry) return false;

    const riderLatLng = new window.google.maps.LatLng(
      parsedRiderLocation.lat,
      parsedRiderLocation.lng,
    );
    let minDistance = Infinity;
    for (let i = 0; i < activePath.length; i += 1) {
      const ptLatLng = new window.google.maps.LatLng(activePath[i].lat, activePath[i].lng);
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
        riderLatLng,
        ptLatLng,
      );
      if (distance < minDistance) minDistance = distance;
    }
    return minDistance > 100;
  }, [activePath, parsedRiderLocation]);

  // Baseline route between restaurant and customer
  useEffect(() => {
    if (!restaurantPoint || !customerPoint) return;
    if (baselineRouteData) return;

    let cancelled = false;
    getRoute(restaurantPoint, customerPoint)
      .then((res) => {
        if (!cancelled && res?.path?.length > 1) {
          setBaselineRouteData(res);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [restaurantPoint, customerPoint, baselineRouteData]);

  // Live rider route to target with throttling (min 60m movement or 20s interval)
  useEffect(() => {
    if (!parsedRiderLocation || !targetLocation) return;

    const now = Date.now();
    const timeSinceLast = now - lastRouteFetchTimeRef.current;
    const moved = hasMovedSignificantly(lastOriginRef.current, parsedRiderLocation, 60);

    if (routeData && !moved && !isOffCurrentRoute && timeSinceLast < 20000) {
      return;
    }

    lastRouteFetchTimeRef.current = now;
    lastOriginRef.current = { lat: parsedRiderLocation.lat, lng: parsedRiderLocation.lng };

    let cancelled = false;
    getRoute(parsedRiderLocation, targetLocation)
      .then((res) => {
        if (cancelled || !res?.path?.length) return;
        setRouteData(res);
        if (onPathReceived) onPathReceived(res.path);
        if (onPolylineReceived && res.encodedPolyline) onPolylineReceived(res.encodedPolyline);
      })
      .catch((err) => {
        console.warn('[LiveMap] Route calculation error:', err);
      });

    return () => { cancelled = true; };
  }, [
    parsedRiderLocation?.lat,
    parsedRiderLocation?.lng,
    targetLocation?.lat,
    targetLocation?.lng,
    isOffCurrentRoute,
    onPathReceived,
    onPolylineReceived,
    routeData,
  ]);

  useEffect(() => {
    (async () => {
      try {
        const response = await zoneAPI.getPublicZones();
        const rawZones = response?.data?.data?.zones;
        if (response?.data?.success && Array.isArray(rawZones)) {
          const formattedZones = rawZones.map(zone => ({
            ...zone,
            paths: (Array.isArray(zone.coordinates) ? zone.coordinates : [])
              .map(coord => ({ lat: Number(coord.latitude), lng: Number(coord.longitude) }))
              .filter(coord => Number.isFinite(coord.lat) && Number.isFinite(coord.lng))
          })).filter(z => z.paths.length >= 3);
          setZones(formattedZones);
        }
      } catch (err) {}
    })();
  }, []);

  const restaurantMarkerUrl = useMemo(() => {
    if (!activeOrder) return 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png';
    return activeOrder.restaurantImage || activeOrder.restaurant?.logo || activeOrder.restaurant?.profileImage || 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png';
  }, [activeOrder]);

  const customerMarkerUrl = useMemo(() => {
    if (!activeOrder) return 'https://cdn-icons-png.flaticon.com/512/1275/1275302.png';
    return activeOrder.customerImage || activeOrder.user?.logo || activeOrder.user?.profileImage || 'https://cdn-icons-png.flaticon.com/512/1275/1275302.png';
  }, [activeOrder]);

  const lastCenteredPosRef = useRef(null);
  const lastBoundsUpdateRef = useRef(0);
  useEffect(() => {
    if (!map || !window.google?.maps) return;

    const hasAnchors = restaurantPoint || customerPoint;
    if (!hasAnchors && !parsedRiderLocation) return;

    const now = Date.now();
    if (now - lastBoundsUpdateRef.current < 12000) return;
    lastBoundsUpdateRef.current = now;

    if (!hasAnchors && parsedRiderLocation) {
      map.panTo(parsedRiderLocation);
    } else {
      const bounds = new window.google.maps.LatLngBounds();
      if (restaurantPoint) bounds.extend(restaurantPoint);
      if (customerPoint) bounds.extend(customerPoint);
      if (parsedRiderLocation) bounds.extend(parsedRiderLocation);

      map.fitBounds(bounds, { top: 70, right: 70, bottom: 120, left: 70 });
    }

    if (parsedRiderLocation) {
      lastCenteredPosRef.current = parsedRiderLocation;
    }
  }, [map, parsedRiderLocation, restaurantPoint, customerPoint]);

  const { remainingPath, traveledPath } = useMemo(() => {
    const maps = window.google?.maps;
    const spherical = maps?.geometry?.spherical;
    const fullPath = activePath;
    if (!parsedRiderLocation || !maps || !spherical || !Array.isArray(fullPath) || fullPath.length === 0) {
      return { remainingPath: fullPath || [], traveledPath: [] };
    }

    let closestIndex = 0;
    let minDistance = Infinity;
    const riderLatLng = new maps.LatLng(parsedRiderLocation.lat, parsedRiderLocation.lng);

    for (let i = 0; i < fullPath.length; i++) {
      const ptLatLng = new maps.LatLng(fullPath[i].lat, fullPath[i].lng);
      const distance = spherical.computeDistanceBetween(riderLatLng, ptLatLng);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    let startIndex = closestIndex;
    if (closestIndex < fullPath.length - 1) {
      const curPt = new maps.LatLng(fullPath[closestIndex].lat, fullPath[closestIndex].lng);
      const nextPt = new maps.LatLng(fullPath[closestIndex + 1].lat, fullPath[closestIndex + 1].lng);
      const distToCurrent = spherical.computeDistanceBetween(riderLatLng, curPt);
      const distToNext = spherical.computeDistanceBetween(riderLatLng, nextPt);
      const segmentLen = spherical.computeDistanceBetween(curPt, nextPt);
      
      if (distToNext < segmentLen && distToNext < distToCurrent) {
        startIndex = closestIndex + 1;
      }
    }

    const riderPoint = { lat: parsedRiderLocation.lat, lng: parsedRiderLocation.lng };
    const traveled = [...fullPath.slice(0, startIndex), riderPoint];
    const remaining = [riderPoint, ...fullPath.slice(startIndex)];

    return { remainingPath: remaining, traveledPath: traveled };
  }, [activePath, parsedRiderLocation]);

  if (loadError) return <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-red-500 font-bold">Map Load Error</div>;
  if (!isLoaded) return <div className="absolute inset-0 flex items-center justify-center bg-gray-50"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  const mapCenter = parsedRiderLocation || targetLocation;

  if (!mapCenter) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 px-8 text-center">
        <div>
          <p className="font-black text-gray-900">Current location unavailable</p>
          <p className="mt-2 text-sm font-medium text-gray-500">Enable precise location to view your delivery zone.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 text-gray-900 overflow-hidden flex flex-col">
      <GoogleMap
        onLoad={handleMapLoad}
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={zoom}
        heading={parsedRiderLocation?.heading || 0}
        tilt={45}
        onClick={(e) => onMapClick?.(e.latLng.lat(), e.latLng.lng())}
        options={mapOptions}
      >

        {traveledPath.length > 0 && (
          <Polyline 
            path={traveledPath} 
            options={{ 
              strokeColor: '#B9A08A', 
              strokeOpacity: 0.5, 
              strokeWeight: 4, 
              zIndex: 10,
              icons: [{
                icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 },
                offset: '0',
                repeat: '10px'
              }]
            }} 
          />
        )}

        {remainingPath.length > 0 && (
          <Polyline 
            path={remainingPath} 
            options={{ 
              strokeColor: '#FF7A3D', 
              strokeOpacity: 0.9, 
              strokeWeight: 8, 
              zIndex: 12 
            }} 
          />
        )}

        {parsedRiderLocation && (
          <OverlayView position={parsedRiderLocation} mapPaneName={OverlayView.MARKER_LAYER}>
            <div style={{ transform: `translate(-50%, -50%) rotate(${parsedRiderLocation.heading || 0}deg)`, transition: 'transform 0.5s linear' }} className="relative w-[72px] h-[72px]">
              <img src="/MapRider.png" alt="Rider" className="w-full h-full object-contain" />
            </div>
          </OverlayView>
        )}

        {restaurantPoint && (
          <Marker
            position={restaurantPoint}
            icon={{
              url: restaurantMarkerUrl,
              scaledSize: new window.google.maps.Size(44, 44),
              anchor: new window.google.maps.Point(22, 22)
            }}
          />
        )}

        {customerPoint && (
          <Marker
            position={customerPoint}
            icon={{
              url: customerMarkerUrl,
              scaledSize: new window.google.maps.Size(44, 44),
              anchor: new window.google.maps.Point(22, 22)
            }}
          />
        )}

        {zones.map((zone) => (
          <Polygon key={zone._id} paths={zone.paths} options={{ fillColor: "#22c55e", fillOpacity: 0.03, strokeColor: "#22c55e", strokeOpacity: 0.1, strokeWeight: 1, zIndex: 1 }} />
        ))}
      </GoogleMap>
    </div>
  );
};

export const LiveMap = (props) => {
  if (!DELIVERY_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 px-8 text-center">
        <div>
          <p className="font-black text-gray-900">Map is not configured</p>
          <p className="mt-2 text-sm font-medium text-gray-500">Set VITE_GOOGLE_MAPS_API_KEY in the frontend environment.</p>
        </div>
      </div>
    );
  }

  return <LiveMapWithApiKey {...props} googleMapsApiKey={DELIVERY_GOOGLE_MAPS_API_KEY} />;
};

export default LiveMap;
