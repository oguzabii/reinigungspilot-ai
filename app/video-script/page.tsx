import type { Metadata } from "next";
import { Clapperboard, Video, MessageSquare, Clock } from "lucide-react";
import { InternalHeader } from "@/components/InternalHeader";
import { VIDEO_SCRIPT } from "@/lib/video-script";

export const metadata: Metadata = {
  title: "Video-Skript (intern) – ReinigungsPilot AI",
  description:
    "Internes 60-Sekunden-Storyboard mit deutschem Voiceover für das geplante Erklärvideo.",
  robots: { index: false, follow: false },
};

export default function VideoScriptPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <InternalHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          <Clapperboard className="h-4 w-4" />
          Video-Support · Intern
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">
          {VIDEO_SCRIPT.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          {VIDEO_SCRIPT.subtitle}
        </p>

        <ol className="mt-8 space-y-4">
          {VIDEO_SCRIPT.scenes.map((scene, index) => (
            <li
              key={scene.time}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  <Clock className="h-3 w-3" />
                  {scene.time}
                </span>
              </div>

              <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                <Video className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>
                  <span className="font-semibold text-slate-500">Bild: </span>
                  {scene.visual}
                </span>
              </p>
              <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-navy-900">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <span>
                  <span className="font-semibold text-blue-600">Voiceover: </span>
                  {scene.voiceover}
                </span>
              </p>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
