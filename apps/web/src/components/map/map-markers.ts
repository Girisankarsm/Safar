import L from "leaflet";

export function createRoutePinIcon(label: "A" | "B", color: string, ringColor: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
        <div style="
          width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          background:${color};border:3px solid #fff;box-shadow:0 0 0 3px ${ringColor}55,0 4px 12px rgba(0,0,0,0.45);
        "></div>
        <span style="
          margin-top:-28px;font-size:13px;font-weight:800;color:#fff;transform:rotate(0deg);
          text-shadow:0 1px 3px rgba(0,0,0,0.8);pointer-events:none;
        ">${label}</span>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
  });
}

export function createUserPinIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);">
        <div style="
          width:18px;height:18px;border-radius:50%;background:#3B82F6;border:3px solid #fff;
          box-shadow:0 0 0 6px rgba(59,130,246,0.35),0 0 0 12px rgba(59,130,246,0.15);
        "></div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export function addLabeledMarker(
  map: L.Map,
  lat: number,
  lng: number,
  options: {
    label: "A" | "B" | "You";
    color: string;
    ringColor: string;
    title: string;
    subtitle?: string;
  }
) {
  const icon =
    options.label === "You"
      ? createUserPinIcon()
      : createRoutePinIcon(options.label as "A" | "B", options.color, options.ringColor);

  const marker = L.marker([lat, lng], { icon, zIndexOffset: options.label === "You" ? 1000 : 500 });
  marker.bindPopup(
    `<strong>${options.title}</strong>${options.subtitle ? `<br/><small>${options.subtitle}</small>` : ""}`
  );
  marker.bindTooltip(options.title, {
    permanent: true,
    direction: "top",
    offset: [0, -44],
    className: "safar-map-label",
  });
  marker.addTo(map);
  return marker;
}
