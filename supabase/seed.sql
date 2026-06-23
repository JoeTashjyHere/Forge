-- Forge lookup seed data. Mirrors src/lib/constants.ts.

insert into public.builder_archetypes (name, description) values
  ('Visionary', 'Generates ideas and sets direction.'),
  ('Builder', 'Designs and builds the product.'),
  ('Operator', 'Organizes execution and keeps teams moving.'),
  ('Designer', 'Crafts the experience and interface.'),
  ('Seller', 'Drives revenue and closes deals.'),
  ('Marketer', 'Grows reach and acquires users.'),
  ('Analyst', 'Validates opportunities with data.')
on conflict (name) do nothing;

insert into public.build_stages (name, description, sort_order) values
  ('Explorer', 'Interested in building. No active idea.', 1),
  ('Idea', 'Has one or more ideas. Needs validation.', 2),
  ('Validation', 'Testing opportunities.', 3),
  ('Building', 'Actively creating.', 4),
  ('Launch', 'Preparing release.', 5),
  ('Growth', 'Has users. Needs traction.', 6),
  ('Business', 'Generating revenue.', 7)
on conflict (name) do nothing;

insert into public.project_stages (name, description, sort_order) values
  ('Idea', 'Concept only.', 1),
  ('Validation', 'Market testing.', 2),
  ('Prototype', 'Initial version exists.', 3),
  ('MVP', 'Working product.', 4),
  ('Launch', 'Preparing public release.', 5),
  ('Growth', 'Acquiring users.', 6),
  ('Revenue', 'Generating revenue.', 7)
on conflict (name) do nothing;

insert into public.availability_levels (label, min_hours, max_hours) values
  ('1-5', 1, 5),
  ('5-10', 5, 10),
  ('10-20', 10, 20),
  ('20+', 20, null)
on conflict (label) do nothing;

insert into public.skills (name, category) values
  ('Software Engineering', 'Engineering'),
  ('Frontend Engineering', 'Engineering'),
  ('Backend Engineering', 'Engineering'),
  ('Mobile Engineering', 'Engineering'),
  ('AI', 'Engineering'),
  ('Data Science', 'Engineering'),
  ('Product Management', 'Product'),
  ('Design', 'Product'),
  ('Marketing', 'Growth'),
  ('Sales', 'Growth'),
  ('Growth', 'Growth'),
  ('Operations', 'Business'),
  ('Finance', 'Business')
on conflict (name) do nothing;

insert into public.interests (name, category) values
  ('AI', 'Technology'),
  ('Sports', 'Lifestyle'),
  ('Finance', 'Business'),
  ('Healthcare', 'Industry'),
  ('Government', 'Industry'),
  ('Education', 'Industry'),
  ('Real Estate', 'Industry'),
  ('Gaming', 'Technology')
on conflict (name) do nothing;
