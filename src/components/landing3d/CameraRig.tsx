import { useMemo, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createScrollRig } from "./scrollProgress";
import { samplePose, sampleHeading } from "./cameraPath";

/**
 * Drives the camera from native page scroll.
 *
 * - Damped progress: the camera glides toward where the page is, so wheel
 *   steps and touch flicks feel like flight, not teleports.
 * - Catch-up clamp: an anchor jump (#inscripcion) fast-forwards to within 1.6
 *   segments instead of replaying the whole city tour.
 * - Trailing lookAt: the gaze is damped separately (slower), which is what
 *   makes it feel like a human camera operator.
 * - Banking: roll from the heading derivative — the "surfing" lean.
 * - Initializes AT the current scroll position: scrollRestoration means the
 *   page can mount mid-flight, and it must not replay from the top.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const rig = useMemo(() => createScrollRig(), []);
  useEffect(() => () => rig.dispose(), [rig]);

  const s = useRef(rig.getProgress()); // start where the page is NOW
  const roll = useRef(0);
  const gaze = useRef(new THREE.Vector3());
  const pos = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());
  const first = useRef(true);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const p = rig.getProgress();

    // Catch-up clamp for big jumps (header CTA → #inscripcion).
    if (Math.abs(p - s.current) > 1.6) {
      s.current = p - 1.6 * Math.sign(p - s.current);
    }
    s.current = THREE.MathUtils.damp(s.current, p, 3.0, dt);

    const { fov } = samplePose(s.current, pos.current, target.current);

    // Idle drift at the hero stop so the opening frame breathes.
    if (s.current < 0.05) {
      const t = performance.now() / 1000;
      pos.current.x += Math.sin(t * 0.6) * 1.5;
      pos.current.y += Math.sin(t * 0.42 + 1.7) * 0.8;
    }

    camera.position.copy(pos.current);

    // Trailing gaze.
    if (first.current) {
      gaze.current.copy(target.current);
      first.current = false;
    } else {
      gaze.current.x = THREE.MathUtils.damp(gaze.current.x, target.current.x, 2.2, dt);
      gaze.current.y = THREE.MathUtils.damp(gaze.current.y, target.current.y, 2.2, dt);
      gaze.current.z = THREE.MathUtils.damp(gaze.current.z, target.current.z, 2.2, dt);
    }
    camera.lookAt(gaze.current);

    // Banking from the change of heading along the path.
    const h0 = sampleHeading(Math.max(0, s.current - 0.01));
    const h1 = sampleHeading(s.current + 0.01);
    let dh = h1 - h0;
    if (dh > Math.PI) dh -= Math.PI * 2;
    if (dh < -Math.PI) dh += Math.PI * 2;
    const targetRoll = THREE.MathUtils.clamp(-dh * 55, -0.16, 0.16);
    roll.current = THREE.MathUtils.damp(roll.current, targetRoll, 4, dt);
    camera.rotateZ(roll.current);

    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
