-- QL-001 seed draft. Review before use.

insert into tags (brand, name, slug, description) values
('rosiedazzlers', 'New Lead', 'new_lead', 'New RosieDazzlers lead'),
('rosiedazzlers', 'Quote Request', 'quote_request', 'Detailing quote request'),
('rosiedazzlers', 'Needs Photos', 'needs_photos', 'Photos needed before quote'),
('rosiedazzlers', 'Pet Hair', 'pet_hair', 'Pet hair concern'),
('rosiedazzlers', 'Odor', 'odor', 'Odor treatment concern'),
('devilndove', 'New Lead', 'new_lead', 'New DevilnDove lead'),
('devilndove', 'Custom Order', 'custom_order', 'Custom order request'),
('devilndove', 'Product Question', 'product_question', 'Product question'),
('devilndove', 'Needs Reference Photos', 'needs_reference_photos', 'Reference photos needed')
on conflict (brand, slug) do nothing;
