# Event Hero — View (index.tsx)

> **Role**: Composes all homepage sections. Zero logic.
> **Location**: `presentations/Home/index.tsx`

```tsx
"use client";

import HeroSection from "@/presentations/Home/sub-components/HeroSection";
import AboutSection from "@/presentations/Home/sub-components/AboutSection";
import GallerySection from "@/presentations/Home/sub-components/GallerySection";
import ReviewsSection from "@/presentations/Home/sub-components/ReviewsSection";
import FooterSection from "@/presentations/Home/sub-components/FooterSection";

/**
 * Home Presentation — THE VIEW (MVVM)
 *
 * Composes all homepage sections from sub-components.
 * No direct logic here — delegates to useHome ViewModel.
 *
 * Location: presentations/Home/index.tsx
 */

export default function HomePresentation() {
    return (
        <div className="min-h-screen bg-background">
            <HeroSection />
            <AboutSection />
            <GallerySection />
            <ReviewsSection />
            <FooterSection />
        </div>
    );
}
```
