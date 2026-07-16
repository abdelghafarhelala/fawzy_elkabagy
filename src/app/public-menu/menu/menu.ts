import { Component, ElementRef, computed, signal, viewChild } from '@angular/core';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

type MenuTabId = 'kebab' | 'mixed' | 'steaks' | 'sides' | 'desserts';

interface MenuItem {
  id: string;
  tab: MenuTabId;
  image: string;
  nameKey: string;
  priceKey: string;
  descKey: string;
  badgeKey?: string;
  tags: { key: string; muted?: boolean }[];
}

@Component({
  selector: 'app-menu',
  imports: [TranslatePipe],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  private readonly signaturesTrack = viewChild<ElementRef<HTMLElement>>('signaturesTrack');

  activeTab = signal<MenuTabId>('kebab');

  readonly tabs = [
    { id: 'kebab' as const, labelKey: 'menu.tabs.kebab', mobileLabelKey: 'menu.tabs.signatures' },
    { id: 'mixed' as const, labelKey: 'menu.tabs.mixed', mobileLabelKey: 'menu.tabs.platters' },
    { id: 'steaks' as const, labelKey: 'menu.tabs.steaks', mobileLabelKey: 'menu.tabs.steaks' },
    { id: 'sides' as const, labelKey: 'menu.tabs.sides', mobileLabelKey: 'menu.tabs.sidesShort' },
    { id: 'desserts' as const, labelKey: 'menu.tabs.desserts', mobileLabelKey: 'menu.tabs.desserts' },
  ];

  readonly items: MenuItem[] = [
    {
      id: 'kofta',
      tab: 'kebab',
      image: '/images/menu-kofta.jpg',
      nameKey: 'menu.items.kofta.name',
      priceKey: 'menu.items.kofta.price',
      descKey: 'menu.items.kofta.desc',
      badgeKey: 'menu.items.kofta.badge',
      tags: [{ key: 'menu.items.kofta.tag1' }, { key: 'menu.items.kofta.tag2' }],
    },
    {
      id: 'lamb',
      tab: 'kebab',
      image: '/images/menu-lamb.jpg',
      nameKey: 'menu.items.lamb.name',
      priceKey: 'menu.items.lamb.price',
      descKey: 'menu.items.lamb.desc',
      tags: [{ key: 'menu.items.lamb.tag1' }],
    },
    {
      id: 'mix',
      tab: 'kebab',
      image: '/images/menu-mix.jpg',
      nameKey: 'menu.items.mix.name',
      priceKey: 'menu.items.mix.price',
      descKey: 'menu.items.mix.desc',
      badgeKey: 'menu.items.mix.badge',
      tags: [{ key: 'menu.items.mix.tag1' }],
    },
    {
      id: 'royal',
      tab: 'mixed',
      image: '/images/menu-mix.jpg',
      nameKey: 'menu.items.royal.name',
      priceKey: 'menu.items.royal.price',
      descKey: 'menu.items.royal.desc',
      tags: [{ key: 'menu.items.royal.tag1' }, { key: 'menu.items.royal.tag2', muted: true }],
    },
    {
      id: 'steak-1',
      tab: 'steaks',
      image: '/images/sig-steaks.jpg',
      nameKey: 'signatures.steaks.title',
      priceKey: 'menu.items.lamb.price',
      descKey: 'signatures.steaks.desc',
      tags: [{ key: 'menu.items.lamb.tag1' }],
    },
    {
      id: 'side-1',
      tab: 'sides',
      image: '/images/sig-garden.jpg',
      nameKey: 'signatures.garden.title',
      priceKey: 'menu.items.kofta.price',
      descKey: 'signatures.garden.desc',
      tags: [{ key: 'menu.items.kofta.tag1', muted: true }],
    },
    {
      id: 'dessert-1',
      tab: 'desserts',
      image: '/images/sig-royal.jpg',
      nameKey: 'menu.items.mix.name',
      priceKey: 'menu.items.mix.price',
      descKey: 'menu.items.mix.desc',
      tags: [{ key: 'menu.items.mix.tag1' }],
    },
  ];

  readonly signatures = [
    {
      id: 'royal',
      image: '/images/sig-royal.jpg',
      titleKey: 'signatures.royal.title',
      descKey: 'signatures.royal.desc',
    },
    {
      id: 'steaks',
      image: '/images/sig-steaks.jpg',
      titleKey: 'signatures.steaks.title',
      descKey: 'signatures.steaks.desc',
    },
    {
      id: 'garden',
      image: '/images/sig-garden.jpg',
      titleKey: 'signatures.garden.title',
      descKey: 'signatures.garden.desc',
    },
  ];

  visibleItems = computed(() => {
    const tab = this.activeTab();
    const filtered = this.items.filter((item) => item.tab === tab);
    return filtered.length ? filtered : this.items.filter((item) => item.tab === 'kebab');
  });

  selectTab(tabId: MenuTabId): void {
    this.activeTab.set(tabId);
  }

  scrollSignatures(direction: -1 | 1): void {
    const track = this.signaturesTrack()?.nativeElement;
    if (!track) {
      return;
    }
    track.scrollBy({ left: direction * 740, behavior: 'smooth' });
  }
}
