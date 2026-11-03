import type { ReactNode } from "react";
import { Check, Mic, Video, PhoneOff } from "lucide-react";

import { Reveal } from "@/features/marketing/reveal";

type RowProps = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  media: ReactNode;
  reverse?: boolean;
};

function Row({ eyebrow, title, description, points, media, reverse }: RowProps) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <Reveal className={reverse ? "lg:order-2" : undefined}>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </span>
        <h3 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
        <ul className="mt-6 flex flex-col gap-3">
          {points.map((point) => (
            <li key={point} className="flex items-center gap-3 text-sm">
              <span className="grid size-5 place-items-center rounded-full bg-accent text-accent-foreground">
                <Check className="size-3" />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={0.1} className={reverse ? "lg:order-1" : undefined}>
        {media}
      </Reveal>
    </div>
  );
}

function ChatMedia() {
  const bubbles = [
    { me: false, text: "Did the designs land?" },
    { me: true, text: "Just sent them over, plus a voice note." },
    { me: false, text: "Perfect, looking now." },
  ];
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-lg">
      <div className="flex flex-col gap-2.5">
        {bubbles.map((b, i) => (
          <div
            key={i}
            className={
              b.me
                ? "max-w-[80%] self-end rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                : "max-w-[80%] self-start rounded-2xl rounded-bl-md bg-secondary px-3.5 py-2 text-sm"
            }
          >
            {b.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function CallMedia() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
        AL
      </span>
      <p className="mt-4 font-display text-lg font-semibold">Ada Lovelace</p>
      <p className="text-sm text-muted-foreground">Connected 00:42</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-secondary">
          <Mic className="size-5" />
        </span>
        <span className="grid size-11 place-items-center rounded-full bg-secondary">
          <Video className="size-5" />
        </span>
        <span className="grid size-11 place-items-center rounded-full bg-destructive text-destructive-foreground">
          <PhoneOff className="size-5" />
        </span>
      </div>
    </div>
  );
}

/** Two product highlights, alternating sides: messaging and calling. */
export function ShowcaseSection() {
  return (
    <section id="showcase" className="bg-secondary/40 py-20 sm:py-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 sm:px-6 sm:gap-28">
        <Row
          eyebrow="Messaging"
          title="Every conversation in one thread."
          description="Text, photos, voice notes, and files live together, in order, the moment they are sent. Scroll back and it is all still there."
          points={["Delivered in real time", "Voice notes and files", "Typing and read state"]}
          media={<ChatMedia />}
        />
        <Row
          eyebrow="Calling"
          title="Calls that connect on the first ring."
          description="Ring a person from any chat, or start a group room and share the link. Answer, decline, mute, or hang up, exactly as you expect."
          points={["One to one and group", "Camera and mic controls", "Turn a chat into a call"]}
          media={<CallMedia />}
          reverse
        />
      </div>
    </section>
  );
}
