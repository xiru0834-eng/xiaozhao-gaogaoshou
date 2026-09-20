import {parseCatalog, type CompanyMeta} from '../shared/catalog-contract.ts';
import type {CompanyRow} from '../shared/types.ts';
import {CATNAME, OWNERSHIPNAME, F} from '../shared/catalog.ts';
export {CATS, CATNAME, OWNERSHIPS, OWNERSHIPNAME, RECRUIT_CHANNELS, RECRUIT_CHANNEL_NAME, F, hasCode} from '../shared/catalog.ts';

// No static fallback: every consumer sees the same fully validated server snapshot.
export let DATA: CompanyRow[] = [];
export let APPEND_DATES = new Map<string,string>();
let metadata = new Map<string,CompanyMeta>();
let revision = -1;
export function installCatalog(value: unknown): boolean {
  const next = parseCatalog(value);
  if (next.revision < revision) throw new Error('Catalog revision moved backwards; reopen the workbench');
  if (next.revision === revision) return false;
  const nextMetadata = new Map(next.metadata.map(entry=>[entry.name,entry]));
  DATA = next.companies;
  APPEND_DATES = new Map(next.appendDates);
  metadata = nextMetadata;
  revision = next.revision;
  return true;
}
function meta(row: CompanyRow): CompanyMeta {
  const entry = metadata.get(row[F.n]);
  if (!entry) throw new Error('Company is not in the active catalog');
  return entry;
}
export function ownershipOf(row: CompanyRow) { return meta(row).ownership; }
export function recruitChannelOf(row: CompanyRow) { return meta(row).channel; }
export function recruitChannelEvidence(row: CompanyRow) { return meta(row).channelEvidence; }
export function aliasesOf(row: CompanyRow) { return meta(row).aliases; }
export function classificationLabel(row: CompanyRow) {
  const owner = OWNERSHIPNAME[ownershipOf(row)];
  const category = (CATNAME[row[F.cat]] || '').split(' · ')[0];
  if ((row[F.cat] === 'frn' && owner === '外企') || (row[F.cat] === 'soe' && owner === '央国企')) return owner;
  return owner + (category ? ' · '+category : '');
}
