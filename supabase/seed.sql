-- TeamBuilder: демо-данные. Запускать ПОСЛЕ schema.sql. Повторный запуск безопасен.
-- Первый зарегистрированный пользователь (вы) становится руководителем проекта «Campus Events».

-- Демо-студенты (вымышленные, is_demo = true)
insert into public.profiles (id, name, grp, role, skills, interests, free_slots, age, city, about, photo, is_demo) values
  ('s2', 'Дамир', 'ПИ-24-1к', 'Backend', array['Node.js', 'PostgreSQL', 'QA', 'Docker']::text[], array['Серверлер', 'AI']::text[], array['Дс 18', 'Бс 17', 'Жм 16']::text[], '20', 'Алматы', 'Серверлік бөлікті және дерекқорды жасағанды ұнатамын.', 'https://randomuser.me/api/portraits/men/32.jpg', true),
  ('s3', 'Айгерім', 'ДИЗ-24-2', 'Дизайнер', array['Figma', 'UI/UX', 'Illustrator']::text[], array['Дизайн', 'Брендинг']::text[], array['Сс 18', 'Сн 12']::text[], '19', 'Астана', 'Қосымшаларға әдемі әрі түсінікті интерфейс сызамын.', 'https://randomuser.me/api/portraits/women/47.jpg', true),
  ('s4', 'Мерей', 'ПИ-24-2к', 'Тестілеуші', array['QA', 'Jest', 'TypeScript']::text[], array['Сапа']::text[], array['Дс 18', 'Жм 16']::text[], '20', 'Қарағанды', 'Қателерді жобаның соңына дейін табамын, тестілеуді жақсы көремін.', 'https://randomuser.me/api/portraits/women/65.jpg', true),
  ('s5', 'Бекзат', 'ПИ-23-1к', 'Менеджер', array['Scrum', 'Figma', 'Trello', 'Presentation']::text[], array['Жобаларды басқару']::text[], array['Дс 18', 'Сс 18', 'Жм 16']::text[], '21', 'Алматы', 'Команданы ұйымдастырамын, мерзімді қадағалаймын, жобаны қорғауға дайындаймын.', 'https://randomuser.me/api/portraits/men/45.jpg', true),
  ('s6', 'Томирис', 'ПИ-24-1к', 'Frontend', array['React', 'UI/UX', 'CSS', 'TypeScript']::text[], array['Веб']::text[], array['Сс 18', 'Сн 12']::text[], '19', 'Шымкент', 'Веб-интерфейстерді жасаймын, анимацияны жақсы көремін.', 'https://randomuser.me/api/portraits/women/44.jpg', true),
  ('s7', 'Ерасыл', 'ПИ-23-2к', 'Backend', array['Python', 'Django', 'PostgreSQL']::text[], array['Деректер']::text[], array['Бс 17']::text[], '21', 'Алматы', 'Python-да сервер жазамын, деректермен жұмыс істеуді ұнатамын.', 'https://randomuser.me/api/portraits/men/68.jpg', true),
  ('s8', 'Әсем', 'ДИЗ-23-1', 'Дизайнер', array['Figma', 'UI/UX', 'Прототиптеу']::text[], array['Мобильді', 'Дизайн']::text[], array['Дс 18', 'Ср 18', 'Жм 16']::text[], '20', 'Алматы', 'Мобильді қосымшалардың UX-ін зерттеп, прототип жасаймын.', 'https://randomuser.me/api/portraits/women/21.jpg', true),
  ('s9', 'Нұрлан', 'ПИ-24-2к', 'Backend', array['Node.js', 'Express', 'MongoDB']::text[], array['Стартап', 'Мобильді']::text[], array['Дс 18', 'Сс 18', 'Жм 16']::text[], '19', 'Алматы', 'Node.js-те API жазамын, мобильді қосымшаларға сервер жасағанмын.', 'https://randomuser.me/api/portraits/men/22.jpg', true),
  ('s10', 'Дана', 'ПИ-23-1к', 'Тестілеуші', array['QA', 'Postman', 'Jest']::text[], array['Сапа', 'Стартап']::text[], array['Сс 18', 'Жм 16']::text[], '21', 'Астана', 'Қолмен және автоматты тестілеу, API тексеру.', 'https://randomuser.me/api/portraits/women/33.jpg', true),
  ('s11', 'Ержан', 'ПИ-22-1к', 'Менеджер', array['Scrum', 'Jira', 'Presentation']::text[], array['Стартап', 'Жобаларды басқару']::text[], array['Дс 18', 'Жм 16']::text[], '22', 'Алматы', 'Хакатондарда команда басқардым, жобаны қорғауға дайындаймын.', 'https://randomuser.me/api/portraits/men/52.jpg', true),
  ('s12', 'Камила', 'ПИ-24-1к', 'Frontend', array['React Native', 'TypeScript', 'Expo']::text[], array['Мобильді']::text[], array['Сс 18', 'Бс 17', 'Жм 16']::text[], '19', 'Шымкент', 'Expo-мен мобильді экрандар жасаймын.', 'https://randomuser.me/api/portraits/women/12.jpg', true),
  ('s13', 'Әлихан', 'ПИ-23-2к', 'Backend', array['Java', 'Spring', 'PostgreSQL']::text[], array['Серверлер']::text[], array['Сн 12']::text[], '21', 'Қарағанды', 'Java-да серверлік жүйелер жазамын.', 'https://randomuser.me/api/portraits/men/75.jpg', true),
  ('s14', 'Жансая', 'ДИЗ-24-1', 'Дизайнер', array['Illustrator', 'Photoshop', 'Брендинг']::text[], array['Брендинг', 'Дизайн']::text[], array['Сс 18', 'Сн 12']::text[], '19', 'Алматы', 'Логотип, фирмалық стиль және иллюстрация жасаймын.', 'https://randomuser.me/api/portraits/women/52.jpg', true),
  ('s15', 'Темірлан', 'ПИ-24-2к', 'Тестілеуші', array['QA', 'Selenium', 'Python']::text[], array['Деректер', 'Сапа']::text[], array['Бс 17', 'Сн 12']::text[], '20', 'Астана', 'Автотест жазамын, Python-ды жақсы білемін.', 'https://randomuser.me/api/portraits/men/36.jpg', true),
  ('s16', 'Аружан', 'ПИ-23-1к', 'Менеджер', array['Trello', 'Presentation', 'Figma']::text[], array['Дизайн', 'Жобаларды басқару']::text[], array['Сс 18', 'Ср 18']::text[], '20', 'Алматы', 'Тапсырмаларды бөліп, мерзімді бақылаймын.', 'https://randomuser.me/api/portraits/women/68.jpg', true),
  ('s17', 'Санжар', 'ПИ-24-1к', 'Frontend', array['React', 'JavaScript', 'CSS']::text[], array['Веб', 'Стартап']::text[], array['Дс 18', 'Ср 18']::text[], '19', 'Алматы', 'Веб-сайттар мен лендингтер жасаймын.', 'https://randomuser.me/api/portraits/men/41.jpg', true),
  ('s18', 'Мадина', 'ПИ-22-2к', 'Backend', array['Python', 'FastAPI', 'Docker', 'AI']::text[], array['AI', 'Деректер']::text[], array['Сс 18', 'Бс 17']::text[], '22', 'Астана', 'Python-да API және машиналық оқыту модельдерін жасаймын.', 'https://randomuser.me/api/portraits/women/28.jpg', true)
on conflict (id) do nothing;

-- Проект демо-руководителя Бекзата
insert into public.projects (id, owner_id, title, description, needed_roles, needed_skills, interests, slots, team_size) values
  ('p2', 's5', 'Study Buddy', 'Бірге дайындалуға арналған студенттер платформасы.', array['Frontend', 'Backend', 'Дизайнер']::text[], array['React', 'PostgreSQL', 'UI/UX']::text[], array[]::text[], array['Сс 18', 'Бс 17', 'Жм 16']::text[], 3)
on conflict (id) do nothing;

insert into public.applications (id, project_id, student_id, role, message, status) values
  ('a4', 'p2', 's6', 'Frontend', 'React-пен жасаймын.', 'accepted'),
  ('a5', 'p2', 's9', 'Backend', 'API жазамын.', 'accepted')
on conflict (id) do nothing;

-- Ваш проект: руководитель — первый зарегистрированный пользователь
do $$
declare me text; my_email text;
begin
  select id::text, email into me, my_email from auth.users order by created_at limit 1;
  if me is null then
    raise notice 'Пока нет ни одного пользователя — войдите в приложение и запустите этот файл ещё раз';
    return;
  end if;

  insert into public.profiles (id, email, name, grp, role, skills, interests, free_slots, age, city, about)
  values (me, my_email, 'Арнур', 'ПИ-24-1к', 'Frontend', array['React Native', 'TypeScript', 'Figma']::text[], array['Мобильді', 'Стартап']::text[], array['Дс 18', 'Сс 18', 'Жм 16']::text[], '19', 'Алматы', 'Мобильді қосымшаларды жасаймын, жоба жетекшісі.')
  on conflict (id) do nothing;

  insert into public.projects (id, owner_id, title, description, needed_roles, needed_skills, interests, slots, team_size) values
    ('p1', me, 'Campus Events', 'Университет іс-шараларына тіркелуге арналған мобильді қосымша.', array['Backend', 'Дизайнер', 'Тестілеуші', 'Менеджер']::text[], array['Node.js', 'Figma', 'QA', 'Scrum']::text[], array[]::text[], array['Дс 18', 'Сс 18', 'Жм 16']::text[], 4)
  on conflict (id) do nothing;

  insert into public.applications (id, project_id, student_id, role, message, status) values
    ('a1', 'p1', 's2', 'Backend', 'Серверді және дерекқорды жасауға дайынмын.', 'pending'),
    ('a2', 'p1', 's3', 'Дизайнер', 'Қосымшаның дизайнын сызып беремін.', 'pending'),
    ('a3', 'p1', 's4', 'Тестілеуші', 'Тестілеуді өз мойныма аламын.', 'pending')
  on conflict (id) do nothing;

  insert into public.tasks (id, project_id, title, assignee_id, status, points) values
    ('t1', 'p1', 'Тіркелу экранын кодтау', me, 'done', 3),
    ('t2', 'p1', 'Негізгі экрандардың макеті', me, 'doing', 2)
  on conflict (id) do nothing;

  insert into public.messages (id, chat_id, author_id, text) values
    ('m1', 'p:p1', me, '«Campus Events» жобасының чаты ашылды. Талқылауды бастаңыз!')
  on conflict (id) do nothing;
end $$;
