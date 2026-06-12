import { permanentRedirect } from "next/navigation";

// Old lead magnet URL — superseded by the printables library.
export default function FreeActivityKitPage() {
    permanentRedirect("/free-printables");
}
