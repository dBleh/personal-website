'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/VerticalNavigation.module.css'; 

interface NavItem {
  id: string;
  label: string;
}

interface VerticalNavigationProps {
  items: NavItem[];
  intersectionRootMargin?: string;
}

export default function VerticalNavigation({
  items,
  intersectionRootMargin = '-33% 0px -66% 0px'
}: VerticalNavigationProps) {
  const [activeSection, setActiveSection] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElementsRef = useRef<Map<Element, string>>(new Map());

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observedElementsRef.current.clear();
    }
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const observerCallback: IntersectionObserverCallback = (entries) => {
       const intersectingEntries = entries.filter(entry => entry.isIntersecting);

       setActiveSection(prevActiveSection => {
         let newlyActive = prevActiveSection; 

         if (intersectingEntries.length > 0) {
           newlyActive = observedElementsRef.current.get(intersectingEntries[0].target) || prevActiveSection;
         }
         if (window.scrollY < 100 && items.length > 0) {
             return items[0].id;
         }

         return newlyActive;
       });
    };

    observerRef.current = new IntersectionObserver(observerCallback, {
      rootMargin: intersectionRootMargin,
      threshold: 0.01,
    });

    items.forEach(item => {
      const element = document.getElementById(item.id);
      if (element) {
        observedElementsRef.current.set(element, item.id);
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
      observedElementsRef.current.clear();
    };
  }, [items, intersectionRootMargin]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    document.getElementById(targetId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    if (history.pushState) {
        history.pushState(null, '', `#${targetId}`);
    } else {
        window.location.hash = targetId;
    }
    setActiveSection(targetId);
  };

  const getItemPosition = (index: number): string => {
    const itemCount = items.length;
    if (itemCount <= 1) return '50%';
    const spacing = 90 / (itemCount - 1);
    return `${5 + (index * spacing)}%`;
  };

  const handleLineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const lineRect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - lineRect.top;
    const lineHeight = lineRect.height;

    if (clickY < 20) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
       if(items.length > 0) setActiveSection(items[0].id);
      return;
    }

    const clickPositionPercent = (clickY / lineHeight) * 100;
    let closestIndex = 0;
    let minDistance = 100;

    items.forEach((item, index) => {
      const itemPositionPercent = parseFloat(getItemPosition(index));
      const distance = Math.abs(itemPositionPercent - clickPositionPercent);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    const targetId = items[closestIndex].id;
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
     setActiveSection(targetId);
     if (history.pushState) {
         history.pushState(null, '', `#${targetId}`);
     }
  };

  return (
    <nav className={styles.container}>
      <div
        className={styles.line}
        onClick={handleLineClick}
        title="Click near top to scroll up, or along the line to navigate"
        
      />

      <ul className={styles.navList}>
        {items.map((item, index) => (
          <li
            key={item.id}
            className={styles.navItem}
            style={{ top: getItemPosition(index) }}
          >
            <a
              href={`#${item.id}`}
              onClick={(e) => handleLinkClick(e, item.id)}
              aria-current={activeSection === item.id ? 'page' : undefined}
              className={`${styles.navLink} ${activeSection === item.id ? styles.active : ''}`}
            >
              <span className={styles.label}>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}