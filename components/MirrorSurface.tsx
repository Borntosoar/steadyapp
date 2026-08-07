import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { Body, BodySm, Caption, useTheme } from './ui';
import { space, radius } from '../constants/theme';

/* A live mirror. Never a camera.
 *
 * There is no still-image path in this file and there must never be one: no photo API, no
 * snapshot, no canvas draw, no recording, no media library write. The stream is rendered
 * and discarded frame by frame.
 *
 * SAFETY.md §1 lists the exact identifiers that must not appear anywhere in the source,
 * and ships a grep to prove it. Those identifiers are deliberately not written out here —
 * a check that matches its own documentation is a check people learn to ignore.
 *
 * Three paths, in order of preference:
 *   native  — expo-camera preview, front lens
 *   web     — getUserMedia into a <video> element
 *   neither — a text-guided session that collects the identical before/after ratings
 *
 * The third path is not a degraded experience. Perceptual retraining works in front of a
 * real mirror; the on-screen surface is a convenience. Someone who declines the camera
 * gets the same exercise and the same data. */

export type MirrorMode = 'live' | 'text';

interface Props {
  onModeResolved: (mode: MirrorMode) => void;
  height?: number;
}

export function MirrorSurface({ onModeResolved, height = 340 }: Props) {
  const c = useTheme();
  const [mode, setMode] = useState<'pending' | 'live' | 'text'>('pending');
  const [reason, setReason] = useState<string | null>(null);

  /* ---------- web ---------- */
  const videoRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* Callback ref rather than an effect assignment.
   *
   * The <video> element does not exist while mode is 'pending', so assigning srcObject
   * inside the getUserMedia effect silently no-ops against a null ref — the stream is
   * acquired, the element mounts a tick later, and the frame stays blank forever. This
   * attaches the moment the node exists, in either order. */
  const attachVideo = useCallback((node: any) => {
    videoRef.current = node;
    if (node && streamRef.current && node.srcObject !== streamRef.current) {
      node.srcObject = streamRef.current;
      void node.play?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;

    const start = async () => {
      const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
      if (!nav?.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setMode('text');
          setReason('This browser does not offer a camera.');
          onModeResolved('text');
        }
        return;
      }
      try {
        const stream = await nav.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
          return;
        }
        streamRef.current = stream;
        // If the element is already mounted, attach now; otherwise attachVideo picks it
        // up when it mounts.
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play?.().catch(() => {});
        }
        setMode('live');
        onModeResolved('live');
      } catch {
        if (!cancelled) {
          setMode('text');
          setReason('No camera access. The session works exactly the same without it.');
          onModeResolved('text');
        }
      }
    };

    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [onModeResolved]);

  /* ---------- native ---------- */
  const [NativeCamera, setNativeCamera] = useState<any>(null);
  const [nativeGranted, setNativeGranted] = useState<boolean | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;

    const load = async () => {
      try {
        // Imported lazily so the web bundle never pulls in the native module.
        const mod = await import('expo-camera');
        const { CameraView, useCameraPermissions } = mod as any;
        void useCameraPermissions; // hooks cannot be called conditionally; request below
        const perm = await (mod as any).Camera?.requestCameraPermissionsAsync?.();
        const granted = perm?.granted ?? perm?.status === 'granted';
        if (cancelled) return;
        setNativeGranted(!!granted);
        if (granted) {
          setNativeCamera(() => CameraView);
          setMode('live');
          onModeResolved('live');
        } else {
          setMode('text');
          setReason('No camera access. The session works exactly the same without it.');
          onModeResolved('text');
        }
      } catch {
        if (!cancelled) {
          setMode('text');
          setReason('Camera unavailable on this device.');
          onModeResolved('text');
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [onModeResolved]);

  const frame = {
    height,
    borderRadius: radius.card,
    overflow: 'hidden' as const,
    backgroundColor: c.surfaceStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.line,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  if (mode === 'pending') {
    return (
      <View style={frame}>
        <Caption>Opening the mirror…</Caption>
      </View>
    );
  }

  if (mode === 'text') {
    return (
      <View style={[frame, { padding: space.lg }]}>
        <Body style={{ textAlign: 'center' }}>Use a real mirror, or simply look ahead.</Body>
        <BodySm style={{ textAlign: 'center', marginTop: space.sm }}>
          {reason ?? 'The prompts and the ratings are identical either way.'}
        </BodySm>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    // react-native-web renders to the DOM, so a raw <video> is legitimate here.
    return (
      <View style={frame}>
        {React.createElement('video', {
          ref: attachVideo,
          autoPlay: true,
          muted: true,
          playsInline: true,
          style: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            // Mirror the image so movement matches a real mirror rather than a video call.
            transform: 'scaleX(-1)',
          },
        })}
      </View>
    );
  }

  if (NativeCamera && nativeGranted) {
    return (
      <View style={frame}>
        <NativeCamera style={{ width: '100%', height: '100%' }} facing="front" />
      </View>
    );
  }

  return (
    <View style={[frame, { padding: space.lg }]}>
      <Body style={{ textAlign: 'center' }}>Use a real mirror, or simply look ahead.</Body>
    </View>
  );
}
