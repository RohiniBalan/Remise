import { Suspense } from "react";
import NewArrivalsContent from "./NewArrivalsContent";

export default function NewArrivalsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <NewArrivalsContent />
        </Suspense>
    );
}