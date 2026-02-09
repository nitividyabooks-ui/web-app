'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getVisitorId } from '@/lib/visitor-id';
import { notifyNewVisitor } from '@/lib/whatsapp-notifications';

/**
 * Client-side visitor tracker component
 * Tracks visitor visits and sends notifications
 */
export default function VisitorTracker() {
  const pathname = usePathname();
  
  useEffect(() => {
    const trackVisitor = async () => {
      try {
        const visitorId = getVisitorId();
        
        // Only track if we have a visitor ID
        if (!visitorId) {
          console.log('[VisitorTracker] No visitor ID available');
          return;
        }

        // Prepare notification data
        const notificationData = {
          page: pathname || '/',
          source: document.referrer,
          visitorId,
        };

        // Send notification to business owner (fire and forget)
        notifyNewVisitor(notificationData).catch(error => {
          console.error('[VisitorTracker] Failed to send notification:', error);
        });

        console.log('[VisitorTracker] Tracked visitor:', visitorId);
      } catch (error) {
        console.error('[VisitorTracker] Error tracking visitor:', error);
      }
    };

    // Delay tracking to avoid blocking initial render
    const timer = setTimeout(trackVisitor, 1000);

    return () => clearTimeout(timer);
  }, [pathname]);
  
  return null; // This component doesn't render anything
}