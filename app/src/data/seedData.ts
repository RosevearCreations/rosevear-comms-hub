import type { HubDatabase } from '../types';

const createdAt = '2026-10-02T12:00:00-04:00';

export const seedDb: HubDatabase = {
  contacts: [
    {
      id: 'contact_rd_demo_1',
      primaryBrand: 'rosiedazzlers',
      name: 'Sample Detailing Lead',
      phone: '+15195550101',
      email: 'sample.detailing@example.com',
      town: 'Tillsonburg',
      customerType: 'lead',
      source: 'seed',
      notes: 'Static local demo contact for QL-003.',
      createdAt,
      updatedAt: createdAt
    },
    {
      id: 'contact_dd_demo_1',
      primaryBrand: 'devilndove',
      name: 'Sample Custom Order Lead',
      phone: '+15195550202',
      email: 'sample.maker@example.com',
      town: 'Norwich',
      customerType: 'lead',
      source: 'seed',
      notes: 'Static local demo contact for QL-003.',
      createdAt,
      updatedAt: createdAt
    }
  ],
  conversations: [
    {
      id: 'conv_rd_demo_1',
      brandId: 'rosiedazzlers',
      contactId: 'contact_rd_demo_1',
      sourceChannel: 'website_form',
      status: 'needs_photos',
      priority: 'high',
      subject: 'SUV interior detail with pet hair',
      summary: 'Customer wants an SUV interior quote and needs to send photos before final pricing.',
      tags: ['quote_request', 'needs_photos', 'pet_hair'],
      lastActivityAt: createdAt,
      createdAt,
      updatedAt: createdAt
    },
    {
      id: 'conv_dd_demo_1',
      brandId: 'devilndove',
      contactId: 'contact_dd_demo_1',
      sourceChannel: 'manual',
      status: 'quote_needed',
      priority: 'normal',
      subject: 'Custom engraved candle gift',
      summary: 'Customer asked about a personalized candle and needs a quote after reference details are confirmed.',
      tags: ['custom_order', 'candle', 'engraving', 'gift_deadline'],
      lastActivityAt: createdAt,
      createdAt,
      updatedAt: createdAt
    }
  ],
  messages: [
    {
      id: 'msg_rd_demo_1',
      conversationId: 'conv_rd_demo_1',
      direction: 'inbound',
      channel: 'website_form',
      body: 'I need an interior detail for an SUV with a lot of dog hair. Can you quote it?',
      aiGenerated: false,
      humanApproved: true,
      createdAt
    },
    {
      id: 'msg_dd_demo_1',
      conversationId: 'conv_dd_demo_1',
      direction: 'inbound',
      channel: 'manual',
      body: 'Can you make a personalized candle gift with engraving?',
      aiGenerated: false,
      humanApproved: true,
      createdAt
    }
  ],
  followUpTasks: [
    {
      id: 'task_rd_demo_1',
      brandId: 'rosiedazzlers',
      contactId: 'contact_rd_demo_1',
      conversationId: 'conv_rd_demo_1',
      title: 'Request interior photos before quote',
      status: 'open',
      priority: 'high',
      notes: 'Ask for seat, carpet, cargo, and pet-hair photos.',
      createdAt,
      updatedAt: createdAt
    },
    {
      id: 'task_dd_demo_1',
      brandId: 'devilndove',
      contactId: 'contact_dd_demo_1',
      conversationId: 'conv_dd_demo_1',
      title: 'Confirm personalization text and deadline',
      status: 'open',
      priority: 'normal',
      notes: 'Need wording, date needed, and style preference.',
      createdAt,
      updatedAt: createdAt
    }
  ],
  intakeRequests: [
    {
      id: 'intake_rd_demo_1',
      brandId: 'rosiedazzlers',
      contactId: 'contact_rd_demo_1',
      conversationId: 'conv_rd_demo_1',
      intakeType: 'detailing_quote',
      rawAnswers: {
        vehicle_type: 'SUV',
        concern: 'pet hair'
      },
      flags: ['pet_hair', 'needs_photos'],
      recommendedService: 'Interior Detail + Pet Hair Add-On',
      status: 'needs_review',
      createdAt,
      updatedAt: createdAt
    }
  ],
  auditEvents: [
    {
      id: 'audit_demo_1',
      brandId: 'rosiedazzlers',
      entityType: 'system',
      entityId: 'seed',
      eventType: 'seed_loaded',
      details: 'QL-003 local seed data loaded.',
      createdAt
    }
  ]
};
