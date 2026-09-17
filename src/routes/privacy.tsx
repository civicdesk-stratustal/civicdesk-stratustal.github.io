import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Shell } from "@/components/glass";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | CivicDesk" },
      {
        name: "description",
        content:
          "How CivicDesk stores your documents, isolates your data with row-level security and uses Google Calendar access only to sync deadlines you request.",
      },
      { property: "og:title", content: "Privacy Policy | CivicDesk" },
      {
        property: "og:description",
        content: "How CivicDesk protects your documents and personal data.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <Shell>
      <main className="safe-top px-5 pb-16">
        <Link
          to="/"
          className="press glass mb-5 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>

        <h1 className="mb-1 text-2xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mb-6 text-xs text-foreground/50">Last updated 16 September 2026</p>

        <div className="space-y-5 text-sm leading-relaxed text-foreground/75">
          <section>
            <h2 className="mb-1 font-semibold text-foreground">Who we are</h2>
            <p>
              CivicDesk is a personal document management tool provided by Stratustal. This policy
              explains what we collect, why we collect it and the choices you have.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">What we collect</h2>
            <p>
              Account details (your email address and, where you provide it, your name); the
              documents and images you upload; the details extracted from them such as titles,
              summaries, categories and deadline dates; your app preferences; and, where you enable
              it, the Google account authorisation used for calendar syncing.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">You own your documents</h2>
            <p>
              You retain full ownership of every document and detail you add. We do not sell your
              data, we do not use your documents for advertising, and we do not use your documents
              to train AI models.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">Secure processing</h2>
            <p>
              Documents are transmitted over encrypted connections and stored in a private storage
              area that is not publicly accessible. When a document is read automatically, it is
              sent to our document-processing provider solely to extract the details shown to you,
              and is not retained by that provider for any other purpose.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">Data isolation</h2>
            <p>
              Your records are isolated at the database level using row-level security. Every query
              is checked against your authenticated user identity, so your items, documents and
              deadlines cannot be read or modified by another user of CivicDesk.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">Google Calendar</h2>
            <p>
              If you turn on calendar sync, we use Google OAuth strictly to create the calendar
              events for deadlines you have asked us to sync. We do not read your existing calendar
              contents, we do not share this access with anyone, and you can turn sync off at any
              time in Settings or revoke access from your Google account.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">Your device PIN</h2>
            <p>
              The optional 4-digit PIN that locks the app is stored only on your device and is never
              transmitted to us. It protects the app on that device and is separate from your
              account password.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">Retention and your rights</h2>
            <p>
              We keep your data for as long as your account is active. You can edit or delete items
              at any time, and you can request deletion of your account and all associated documents,
              after which they are removed from live systems. You may also request a copy of the data
              held about you.
            </p>
          </section>
          <section>
            <h2 className="mb-1 font-semibold text-foreground">Changes and contact</h2>
            <p>
              If this policy changes materially we will notify you in the app. For privacy questions,
              contact us through the support channel listed on our website. See also our{" "}
              <Link to="/terms" className="font-medium text-primary">
                Terms of Service
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </Shell>
  );
}
