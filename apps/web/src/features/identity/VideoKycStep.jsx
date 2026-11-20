// Video KYC: say your name and a one-time code on camera, then upload the clip.
import {useEffect, useRef, useState} from 'react';
import {Camera, Circle, RotateCcw, Square, Upload} from 'lucide-react';
import {api, authFetch} from '../../lib/api/client';
import {formatDate} from '../../lib/format';
import {Button} from '../../components/ui/Button';

const MAX_SECONDS = 20;
const MIN_SECONDS = 3;
const MAX_BYTES = 12 * 1024 * 1024; // the identity service refuses anything bigger

// The first recording format this browser supports (Chrome/Firefox: WebM, Safari: MP4).
const pickMimeType = () =>
  ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find((t) => window.MediaRecorder?.isTypeSupported(t));

export function VideoKycStep({doc, onSaved, onBack}) {
  const preview = useRef(null);
  const stream = useRef(null);
  const recorder = useRef(null);
  const [challenge, setChallenge] = useState(null);
  const [phase, setPhase] = useState('ready'); // ready → live → recording → recorded → uploading
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState(null); // {blob, url}
  const [error, setError] = useState('');

  const getChallenge = () =>
    api('/identity/kyc/challenge', {method: 'POST'}).then(setChallenge, (err) => setError(err.message));

  useEffect(() => {
    getChallenge();
    // Leaving the step always turns the camera off.
    return () => stream.current?.getTracks().forEach((t) => t.stop());
  }, []);

  // Count up while recording; stop on its own at the limit.
  useEffect(() => {
    if (phase !== 'recording') return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    if (phase === 'recording' && seconds >= MAX_SECONDS) stopRecording();
  }, [phase, seconds]);

  async function startCamera() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || !pickMimeType()) {
      return setError('This browser cannot record video. Try the latest Chrome, Firefox or Safari.');
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: 'user', width: {ideal: 640}, height: {ideal: 480}},
        audio: true,
      });
      preview.current.srcObject = stream.current;
      setPhase('live');
    } catch {
      setError('We could not open your camera and microphone. Allow access in your browser, then try again.');
    }
  }

  function startRecording() {
    const chunks = [];
    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream.current, {mimeType, videoBitsPerSecond: 1_000_000});
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunks, {type: mimeType.split(';')[0]});
      setClip({blob, url: URL.createObjectURL(blob)});
      setPhase('recorded');
    };
    recorder.current = rec;
    setSeconds(0);
    rec.start(1000);
    setPhase('recording');
  }

  function stopRecording() {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }

  async function recordAgain() {
    if (clip) URL.revokeObjectURL(clip.url);
    setClip(null);
    await getChallenge(); // a fresh code if the old one ran out
    setPhase(stream.current ? 'live' : 'ready');
  }

  async function upload() {
    if (clip.blob.size > MAX_BYTES) return setError('This recording is too large. Record a shorter one.');
    setPhase('uploading');
    setError('');
    try {
      const res = await authFetch('/api/identity/kyc/video', {
        method: 'POST',
        headers: {'Content-Type': clip.blob.type},
        body: clip.blob,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error?.message ?? 'Upload failed. Try again.');
      stream.current?.getTracks().forEach((t) => t.stop());
      onSaved(json.data);
    } catch (err) {
      setError(err.message);
      setPhase('recorded');
    }
  }

  const recordedBefore = doc?.kyc?.recordedAt;
  return (
    <div className="space-y-6">
      <p className="body">
        A short video shows our team that the person applying is real and present.{' '}
        <strong>Look at the camera, say your full name, then say the code below.</strong> Our team watches it by hand;
        the video is deleted once your ID is issued.
      </p>

      <div className="flex flex-wrap items-center gap-6 rounded-[18px] border border-accent p-6">
        <div>
          <p className="eyebrow">Your code</p>
          <p className="num mt-2 tracking-[0.3em]" aria-live="polite">
            {challenge?.challenge ?? '····'}
          </p>
        </div>
        <p className="text-sm text-muted">
          Valid until {challenge ? new Date(challenge.expiresAt).toLocaleTimeString('en-IN') : '…'}. Record within that
          time.
        </p>
      </div>

      <div className="relative aspect-[4/3] max-w-xl overflow-hidden rounded-[22px] border border-rule bg-inverse">
        {/* Live camera (muted so you do not hear yourself) or the finished clip. */}
        <video
          ref={preview}
          autoPlay
          muted
          playsInline
          className={`size-full object-cover ${clip ? 'hidden' : ''}`}
          aria-label="Camera preview"
        />
        {clip && (
          <video src={clip.url} controls playsInline className="size-full object-cover" aria-label="Your recording" />
        )}
        {phase === 'ready' && !clip && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-on-inverse">
            <p>Your camera is off.</p>
          </div>
        )}
        {phase === 'recording' && (
          <span className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1 text-sm text-ink tabular-nums">
            <Circle aria-hidden className="size-3 fill-accent text-accent" /> Recording {seconds}s / {MAX_SECONDS}s
          </span>
        )}
      </div>

      {recordedBefore && !clip && (
        <p className="text-sm text-muted">
          You already recorded a video on {formatDate(recordedBefore)}. Record again only if you want to replace it.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {phase === 'ready' && (
          <Button onClick={startCamera} variant="accent" icon={Camera}>
            Turn on camera
          </Button>
        )}
        {phase === 'live' && (
          <Button onClick={startRecording} variant="accent" icon={Circle} disabled={!challenge}>
            Start recording
          </Button>
        )}
        {phase === 'recording' && (
          <Button onClick={stopRecording} variant="accent" icon={Square} disabled={seconds < MIN_SECONDS}>
            Stop
          </Button>
        )}
        {(phase === 'recorded' || phase === 'uploading') && (
          <>
            <Button onClick={upload} variant="accent" icon={Upload} disabled={phase === 'uploading'}>
              {phase === 'uploading' ? 'Uploading' : 'Upload and continue'}
            </Button>
            <Button onClick={recordAgain} variant="outline" icon={RotateCcw} disabled={phase === 'uploading'}>
              Record again
            </Button>
          </>
        )}
        {recordedBefore && phase === 'ready' && (
          <Button onClick={() => onSaved(null)} variant="outline">
            Keep my video
          </Button>
        )}
        {onBack && phase !== 'recording' && phase !== 'uploading' && (
          <Button onClick={onBack} variant="outline" icon={null}>
            Back
          </Button>
        )}
      </div>
    </div>
  );
}
