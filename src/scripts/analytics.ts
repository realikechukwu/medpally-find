import type { CaptureResult, PostHog } from 'posthog-js';

const projectToken = import.meta.env.PUBLIC_POSTHOG_PROJECT_TOKEN;
const apiHost = import.meta.env.PUBLIC_POSTHOG_HOST;
const consentKey = 'mpf:analytics';
const allowedEvents = new Set(['$pageview', '$pageleave', 'resource_opened', 'resource_saved', 'directory_search']);
const allowedProperties = [
  'distinct_id', '$session_id', '$window_id', '$device_id', '$lib', '$lib_version',
  '$browser', '$browser_version', '$os', '$device_type', '$referring_domain',
  '$session_entry_referring_domain', '$prev_pageview_duration', '$pageview_id',
  'resource_id', 'resource_type', 'result_count',
];

type Consent = 'allow' | 'decline' | null;
type DirectoryEvents = {
  resource_opened: { resource_id: string; resource_type: string };
  resource_saved: { resource_id: string };
  directory_search: { result_count: number };
};

let choice: Consent = null;
let client: PostHog | undefined;
let loading: Promise<void> | undefined;

function readChoice(): Consent {
  try {
    const value = localStorage.getItem(consentKey);
    return value === 'allow' || value === 'decline' ? value : null;
  } catch {
    return null;
  }
}

function startAnalytics(page: URL) {
  loading ??= import('posthog-js').then(({ default: posthog }) => {
    if (choice !== 'allow') return;
    client = posthog.init(projectToken, {
      api_host: apiHost,
      defaults: '2026-08-30',
      person_profiles: 'never',
      persistence: 'localStorage',
      opt_out_capturing_persistence_type: 'localStorage',
      opt_out_persistence_by_default: true,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: true,
      capture_dead_clicks: false,
      capture_performance: false,
      disable_session_recording: true,
      disable_external_dependency_loading: true,
      disable_surveys: true,
      enable_heatmaps: false,
      advanced_disable_flags: true,
      save_campaign_params: false,
      request_batching: false,
      before_send: (event: CaptureResult) => {
        if (choice !== 'allow' || !allowedEvents.has(event.event)) return null;
        // Keep only these fields so URL queries, fragments and form text stay in the browser.
        const properties = Object.fromEntries(allowedProperties.flatMap(key =>
          key in event.properties ? [[key, event.properties[key]]] : []));
        for (const key of ['$referrer', '$session_entry_referrer']) {
          const value = event.properties[key];
          if (value === '$direct') properties[key] = value;
          else if (typeof value === 'string' && /^https?:\/\//i.test(value)) properties[key] = new URL(value).origin;
        }
        return {
          event: event.event,
          uuid: event.uuid,
          timestamp: event.timestamp,
          properties: {
            ...properties,
            $current_url: page.href,
            $host: page.host,
            $pathname: page.pathname,
            $process_person_profile: false,
            $geoip_disable: true,
          },
        };
      },
    });
    if (client?.has_opted_out_capturing()) client.opt_in_capturing({ captureEventName: false });
    client?.capture('$pageview');
  }).catch(() => {
    // Analytics must never interfere with using the directory.
  }).finally(() => { loading = undefined; });
}

export function trackDirectoryEvent<Name extends keyof DirectoryEvents>(name: Name, properties: DirectoryEvents[Name]) {
  if (choice !== 'allow') return;
  if (client) client.capture(name, properties);
  else void loading?.then(() => {
    if (choice === 'allow') client?.capture(name, properties);
  });
}

const panel = document.querySelector<HTMLElement>('#analytics-consent');
const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
if (projectToken && apiHost && panel && canonical) {
  const page = new URL(new URL(canonical.href).pathname, location.origin);
  const heading = panel.querySelector<HTMLElement>('h2')!;
  const allow = panel.querySelector<HTMLButtonElement>('[data-analytics-choice="allow"]')!;
  const decline = panel.querySelector<HTMLButtonElement>('[data-analytics-choice="decline"]')!;
  const settings = document.querySelector<HTMLButtonElement>('[data-analytics-settings]')!;
  let returnFocus = false;

  function applyChoice(value: Consent) {
    const previous = choice;
    choice = value;
    panel!.hidden = value !== null;
    heading.textContent = value === null ? 'Allow optional analytics?' : 'Analytics settings';
    if (value === 'allow') {
      if (!client) startAnalytics(page);
      else if (previous !== 'allow') {
        client.opt_in_capturing({ captureEventName: false });
        client.capture('$pageview');
      }
    } else if (client && previous === 'allow') {
      client.opt_out_capturing();
    }
  }

  function setChoice(value: Exclude<Consent, null>) {
    try { localStorage.setItem(consentKey, value); } catch { /* Apply for this page. */ }
    applyChoice(value);
    if (returnFocus) settings.focus();
    returnFocus = false;
  }

  settings.hidden = false;
  settings.addEventListener('click', () => {
    returnFocus = true;
    panel.hidden = false;
    heading.focus();
  });
  allow.addEventListener('click', () => setChoice('allow'));
  decline.addEventListener('click', () => setChoice('decline'));
  addEventListener('storage', event => {
    if (event.key === consentKey || event.key === null) applyChoice(readChoice());
  });
  addEventListener('pageshow', event => {
    if (event.persisted) applyChoice(readChoice());
  });

  function trackResourceOpen(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('[data-resource-open]');
    if (link?.dataset.resourceOpen && link.dataset.resourceType) {
      trackDirectoryEvent('resource_opened', { resource_id: link.dataset.resourceOpen, resource_type: link.dataset.resourceType });
    }
  }
  document.addEventListener('click', trackResourceOpen);
  document.addEventListener('auxclick', event => { if (event.button === 1) trackResourceOpen(event); });
  applyChoice(readChoice());
}
