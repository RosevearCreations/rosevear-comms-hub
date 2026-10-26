import type { BrandId } from '../types';

export type OrganizationId = BrandId | 'icamp' | 'yw';
export type OperatorWorkspace = 'dashboard' | 'inbox' | 'contacts' | 'queue' | 'phone' | 'composer' | 'calendar' | 'reports' | 'connectors' | 'samples' | 'evidence' | 'trial' | 'repair' | 'review' | 'intake' | 'audit' | 'handoff' | 'reassessment' | 'recurrence' | 'closure' | 'reopen' | 'refresh' | 'exception' | 'aging' | 'overdue' | 'disposition' | 'reopen_review' | 'telephony';

export interface OperatorOrganization {
  id: OrganizationId;
  name: string;
  businessType: string;
  summary: string;
  intakeLabel: string;
  legacyBrandId: BrandId | null;
  tenantModel: 'single-business' | 'multi-tenant-planned';
  modules: readonly string[];
}

/**
 * UI-only organization registry. It is not an access-control grant, backend
 * tenant registry, provider configuration, or proof of connector availability.
 */
export const operatorOrganizations: readonly OperatorOrganization[] = [
  {
    id: 'rosiedazzlers', name: 'Rosie Dazzlers', businessType: 'Mobile auto detailing',
    summary: 'Quotes, booking questions, service photos and detailing follow-ups.',
    intakeLabel: 'Detailing inquiries', legacyBrandId: 'rosiedazzlers',
    tenantModel: 'single-business', modules: ['Quotes', 'Bookings', 'Customer follow-ups']
  },
  {
    id: 'devilndove', name: 'Devil n Dove', businessType: 'Maker and artisan shop',
    summary: 'Custom orders, commissions, product questions and maker requests.',
    intakeLabel: 'Custom order inquiries', legacyBrandId: 'devilndove',
    tenantModel: 'single-business', modules: ['Custom orders', 'Commissions', 'Product questions']
  },
  {
    id: 'icamp', name: 'iCamp', businessType: 'Campground operations',
    summary: 'Campsite reservations, guests, maintenance, events and visitor support.',
    intakeLabel: 'Campground inquiries', legacyBrandId: null,
    tenantModel: 'multi-tenant-planned', modules: ['Reservations', 'Guest services', 'Campground maintenance']
  },
  {
    id: 'yw', name: 'YW · Property Maintenance', businessType: 'Property Maintenance System',
    summary: 'Property owners, service quotes, job updates, dispatch and contracts.',
    intakeLabel: 'Property service inquiries', legacyBrandId: null,
    tenantModel: 'multi-tenant-planned', modules: ['Clients & properties', 'Jobs & dispatch', 'Service contracts']
  }
] as const;

export function findOperatorOrganization(id: string): OperatorOrganization | undefined {
  return operatorOrganizations.find((organization) => organization.id === id);
}

export function initialOperatorOrganization(envValue: string | undefined): OperatorOrganization {
  return findOperatorOrganization(envValue ?? '') ?? operatorOrganizations[0];
}
