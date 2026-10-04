// Seconds after "Launch". Shared by the 3D scene and the overlay; kept apart
// from teamScene so importing it doesn't pull three.js into the page bundle.
export const TIMELINE = {
  liftoff: 3,
  warp: 5.4,
  arrive: 7.2,
  revealed: 9.6,
};
