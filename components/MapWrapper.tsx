"use client";

import dynamic from "next/dynamic";

const BuildingMap = dynamic(() => import("./BuildingMap"), { ssr: false });

export default function MapWrapper(props: React.ComponentProps<typeof BuildingMap>) {
  return <BuildingMap {...props} />;
}
