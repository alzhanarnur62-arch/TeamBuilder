-- TeamBuilder: новости кампуса на 3 языках (REST API для ЗЖ 8/10) и переводы демо-данных.
-- Запускать в SQL Editor после schema.sql и seed.sql. Повторный запуск безопасен.

-- ============ 1. Новости кампуса ============
-- Читаются приложением через REST API: GET /rest/v1/announcements (fetch)

create table if not exists public.announcements (
  id int primary key,
  author_id int not null default 1,
  title_kk text not null, title_ru text not null, title_en text not null,
  body_kk text not null,  body_ru text not null,  body_en text not null,
  created_at timestamptz not null default now()
);

-- Как у настоящих новостей: фото, рубрика, дата публикации
alter table public.announcements add column if not exists image_url text;
alter table public.announcements add column if not exists category text not null default 'campus';
alter table public.announcements add column if not exists published_at timestamptz not null default now();

alter table public.announcements enable row level security;
drop policy if exists announcements_read on public.announcements;
-- Новости публичные: читать может любой, менять — только через SQL Editor
create policy announcements_read on public.announcements for select to anon, authenticated using (true);

insert into public.announcements (id, author_id, title_kk, title_ru, title_en, body_kk, body_ru, body_en) values
(1, 1,
 'TeamBuilder Cup 2026 хакатонына тіркелу ашылды',
 'Открыта регистрация на хакатон TeamBuilder Cup 2026',
 'Registration for the TeamBuilder Cup 2026 hackathon is open',
 '15–16 қарашада 48 сағаттық хакатон өтеді. 3–5 адамнан тұратын команда жинап, қосымшадағы «Іс-шараға тіркелу» формасы арқылы өтінім беріңіз. Жеңімпаздарға грант пен тағылымдама беріледі.',
 '15–16 ноября пройдёт 48-часовой хакатон. Соберите команду из 3–5 человек и подайте заявку через форму «Регистрация на мероприятие» в приложении. Победителей ждут грант и стажировка.',
 'A 48-hour hackathon takes place on 15–16 November. Build a team of 3–5 people and apply through the Event registration form in the app. Winners get a grant and an internship.'),
(2, 2,
 'Сессия кезінде кітапхана 22:00-ге дейін ашық',
 'Во время сессии библиотека открыта до 22:00',
 'The library stays open until 22:00 during exams',
 'Емтихан кезеңінде оқу залы күн сайын 08:00-ден 22:00-ге дейін жұмыс істейді. Студенттік билетті ұмытпаңыз.',
 'В период экзаменов читальный зал работает ежедневно с 08:00 до 22:00. Не забудьте студенческий билет.',
 'During the exam period the reading room is open every day from 08:00 to 22:00. Bring your student ID.'),
(3, 3,
 'IT-мансап күні: 12 компаниямен кездесу',
 'День IT-карьеры: встреча с 12 компаниями',
 'IT Career Day: meet 12 companies',
 '20 қарашада акт залында IT-компаниялар тағылымдама мен жұмыс ұсынады. Түйіндемеңізді алдын ала дайындап алыңыз.',
 '20 ноября в актовом зале IT-компании расскажут о стажировках и вакансиях. Подготовьте резюме заранее.',
 'On 20 November IT companies will present internships and jobs in the assembly hall. Prepare your CV in advance.'),
(4, 1,
 'Мобильді қосымшалар бойынша шеберлік сабағы',
 'Мастер-класс по мобильной разработке',
 'Mobile development workshop',
 'React Native және Expo бойынша практикалық сабақ: 2 сағатта алғашқы қосымшаңызды телефонға шығарасыз. Ноутбук алып келіңіз.',
 'Практическое занятие по React Native и Expo: за 2 часа запустите своё первое приложение на телефоне. Возьмите ноутбук.',
 'A hands-on session on React Native and Expo: launch your first app on your phone in 2 hours. Bring a laptop.'),
(5, 2,
 'Курстық жобаларды тапсыру мерзімі — 5 желтоқсан',
 'Срок сдачи курсовых проектов — 5 декабря',
 'Course projects are due on 5 December',
 'Жоба коды, скриншоттар және қысқа есеп 5 желтоқсанға дейін тапсырылуы керек. Кешіккен жұмыстар төмен бағаланады.',
 'Код проекта, скриншоты и краткий отчёт нужно сдать до 5 декабря. Работы, сданные позже, оцениваются ниже.',
 'Submit the project code, screenshots and a short report by 5 December. Late work gets a lower grade.'),
(6, 3,
 'Студенттік кеңеске сайлау',
 'Выборы в студенческий совет',
 'Student council elections',
 'Кандидаттар тізімі сайтта жарияланды. Дауыс беру 25 қарашада студенттік порталда өтеді.',
 'Список кандидатов опубликован на сайте. Голосование пройдёт 25 ноября на студенческом портале.',
 'The list of candidates is on the website. Voting takes place on 25 November on the student portal.'),
(7, 1,
 'Факультетаралық футбол турнирі',
 'Межфакультетский турнир по футболу',
 'Inter-faculty football tournament',
 'Командаларды тіркеу 18 қарашаға дейін жалғасады. Ойындар университет стадионында өтеді.',
 'Регистрация команд продлится до 18 ноября. Матчи пройдут на университетском стадионе.',
 'Team registration is open until 18 November. Matches take place at the university stadium.'),
(8, 2,
 'Кампуста Wi-Fi жаңартылды',
 'В кампусе обновили Wi-Fi',
 'Campus Wi-Fi has been upgraded',
 'Барлық корпустарда жаңа желі іске қосылды. Студенттік логин мен құпиясөз арқылы қосылыңыз.',
 'Во всех корпусах запущена новая сеть. Подключайтесь через студенческий логин и пароль.',
 'A new network is live in every building. Connect with your student login and password.'),
(9, 3,
 'Ағылшын тілі клубы жұма сайын',
 'Клуб английского языка по пятницам',
 'English speaking club every Friday',
 'Әр жұма сағат 16:00-де 214 аудиторияда сөйлесу клубы өтеді. Барлық деңгейдегі студенттерге ашық.',
 'Каждую пятницу в 16:00 в аудитории 214 проходит разговорный клуб. Открыт для студентов любого уровня.',
 'A speaking club meets every Friday at 16:00 in room 214. Students of any level are welcome.'),
(10, 1,
 '«Таза кампус» еріктілер акциясы',
 'Волонтёрская акция «Чистый кампус»',
 'Clean Campus volunteer day',
 '30 қарашада кампус аумағын бірге тазалаймыз. Қатысушыларға еріктілік сертификаты беріледі.',
 '30 ноября вместе убираем территорию кампуса. Участники получат волонтёрский сертификат.',
 'On 30 November we clean up the campus together. Participants get a volunteer certificate.')
on conflict (id) do update set
  author_id = excluded.author_id,
  title_kk = excluded.title_kk, title_ru = excluded.title_ru, title_en = excluded.title_en,
  body_kk = excluded.body_kk, body_ru = excluded.body_ru, body_en = excluded.body_en;

-- Фото (Unsplash), рубрика, источник и дата публикации (самая свежая — сегодня)
-- Источники (author_id): 1 — студенческий отдел, 2 — учебный отдел, 3 — центр карьеры, 4 — IT-отдел, 5 — спортклуб
update public.announcements as a
set author_id = v.author_id, image_url = v.image_url, category = v.category,
    published_at = date_trunc('hour', now()) - make_interval(days => v.days_ago, hours => v.id)
from (values
  (1, 1, 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&q=75&auto=format&fit=crop', 'events', 0),
  (2, 2, 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1000&q=75&auto=format&fit=crop', 'study', 1),
  (3, 3, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&q=75&auto=format&fit=crop', 'career', 1),
  (4, 3, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&q=75&auto=format&fit=crop', 'events', 2),
  (5, 2, 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000&q=75&auto=format&fit=crop', 'study', 3),
  (6, 1, 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=1000&q=75&auto=format&fit=crop', 'campus', 4),
  (7, 5, 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1000&q=75&auto=format&fit=crop', 'sport', 5),
  (8, 4, 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1000&q=75&auto=format&fit=crop', 'campus', 6),
  (9, 1, 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1000&q=75&auto=format&fit=crop', 'clubs', 7),
  (10, 1, 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1000&q=75&auto=format&fit=crop', 'campus', 8)
) as v(id, author_id, image_url, category, days_ago)
where a.id = v.id;

-- ============ 2. Переводы демо-данных ============
-- i18n = {"ru": {...}, "en": {...}}. Казахский текст остаётся в основных колонках.

alter table public.projects add column if not exists i18n jsonb not null default '{}';
alter table public.profiles add column if not exists i18n jsonb not null default '{}';

update public.projects set i18n = '{"ru":{"description":"Мобильное приложение для регистрации на университетские мероприятия."},"en":{"description":"A mobile app for signing up to university events."}}'
  where id = 'p1';
update public.projects set i18n = '{"ru":{"description":"Платформа для студентов, чтобы готовиться вместе."},"en":{"description":"A platform for students to study together."}}'
  where id = 'p2';

update public.profiles as p set i18n = v.i18n::jsonb
from (values
  ('s2',  '{"ru":{"city":"Алматы","about":"Люблю делать серверную часть и базы данных."},"en":{"city":"Almaty","about":"I enjoy building back ends and databases."}}'),
  ('s3',  '{"ru":{"city":"Астана","about":"Рисую красивые и понятные интерфейсы для приложений."},"en":{"city":"Astana","about":"I design beautiful, clear app interfaces."}}'),
  ('s4',  '{"ru":{"city":"Караганда","about":"Нахожу ошибки до самого конца проекта, люблю тестирование."},"en":{"city":"Karaganda","about":"I hunt bugs until the very end of a project and love testing."}}'),
  ('s5',  '{"ru":{"city":"Алматы","about":"Организую команду, слежу за сроками и готовлю проект к защите."},"en":{"city":"Almaty","about":"I organise the team, track deadlines and prepare the project defence."}}'),
  ('s6',  '{"ru":{"city":"Шымкент","about":"Делаю веб-интерфейсы, люблю анимации."},"en":{"city":"Shymkent","about":"I build web interfaces and love animations."}}'),
  ('s7',  '{"ru":{"city":"Алматы","about":"Пишу серверы на Python, люблю работать с данными."},"en":{"city":"Almaty","about":"I write servers in Python and enjoy working with data."}}'),
  ('s8',  '{"ru":{"city":"Алматы","about":"Изучаю UX мобильных приложений и делаю прототипы."},"en":{"city":"Almaty","about":"I research mobile app UX and build prototypes."}}'),
  ('s9',  '{"ru":{"city":"Алматы","about":"Пишу API на Node.js, делал серверы для мобильных приложений."},"en":{"city":"Almaty","about":"I write APIs in Node.js and have built back ends for mobile apps."}}'),
  ('s10', '{"ru":{"city":"Астана","about":"Ручное и автоматическое тестирование, проверка API."},"en":{"city":"Astana","about":"Manual and automated testing, API checks."}}'),
  ('s11', '{"ru":{"city":"Алматы","about":"Руководил командами на хакатонах, готовлю проект к защите."},"en":{"city":"Almaty","about":"I have led teams at hackathons and prepare projects for defence."}}'),
  ('s12', '{"ru":{"city":"Шымкент","about":"Делаю мобильные экраны на Expo."},"en":{"city":"Shymkent","about":"I build mobile screens with Expo."}}'),
  ('s13', '{"ru":{"city":"Караганда","about":"Пишу серверные системы на Java."},"en":{"city":"Karaganda","about":"I write back-end systems in Java."}}'),
  ('s14', '{"ru":{"city":"Алматы","about":"Делаю логотипы, фирменный стиль и иллюстрации."},"en":{"city":"Almaty","about":"I create logos, brand identities and illustrations."}}'),
  ('s15', '{"ru":{"city":"Астана","about":"Пишу автотесты, хорошо знаю Python."},"en":{"city":"Astana","about":"I write automated tests and know Python well."}}'),
  ('s16', '{"ru":{"city":"Алматы","about":"Распределяю задачи и слежу за сроками."},"en":{"city":"Almaty","about":"I split up tasks and keep an eye on deadlines."}}'),
  ('s17', '{"ru":{"city":"Алматы","about":"Делаю веб-сайты и лендинги."},"en":{"city":"Almaty","about":"I build websites and landing pages."}}'),
  ('s18', '{"ru":{"city":"Астана","about":"Делаю API и модели машинного обучения на Python."},"en":{"city":"Astana","about":"I build APIs and machine learning models in Python."}}')
) as v(id, i18n)
where p.id = v.id;

-- Профиль руководителя из seed.sql (если текст «о себе» не меняли)
update public.profiles set i18n = '{"ru":{"city":"Алматы","about":"Делаю мобильные приложения, руководитель проекта."},"en":{"city":"Almaty","about":"I build mobile apps and lead the project."}}'
  where is_demo = false and about = 'Мобильді қосымшаларды жасаймын, жоба жетекшісі.';

notify pgrst, 'reload schema';
