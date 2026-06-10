-- ============================================
-- ПОЛНОЕ СОЗДАНИЕ БАЗЫ ДАННЫХ VOLUNTEER HUB
-- ============================================

-- Удаляем старые таблицы (осторожно: удалит все данные!)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- ============================================
-- ТАБЛИЦА МЕРОПРИЯТИЙ
-- ============================================
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('ecology','social','education','health','animals','culture','sport')),
  city TEXT NOT NULL,
  address TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  duration_hours INTEGER NOT NULL DEFAULT 2,
  max_volunteers INTEGER,
  current_volunteers INTEGER DEFAULT 0,
  image_url TEXT,
  organizer_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ТАБЛИЦА ПРОФИЛЕЙ
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  nickname TEXT, -- Убрали UNIQUE для упрощения
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  total_hours INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ТАБЛИЦА ЗАПИСЕЙ НА МЕРОПРИЯТИЯ
-- ============================================
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered','attended','cancelled')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- ============================================
-- ИНДЕКСЫ ДЛЯ БЫСТРОДЕЙСТВИЯ
-- ============================================
CREATE INDEX idx_events_status_date ON events(status, event_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_event ON bookings(event_id);
CREATE INDEX idx_profiles_hours ON profiles(total_hours DESC);
CREATE INDEX idx_profiles_nickname ON profiles(nickname);

-- ============================================
-- ФУНКЦИИ ДЛЯ РАБОТЫ С ЧАСАМИ
-- ============================================
CREATE OR REPLACE FUNCTION increment_volunteers(event_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE events SET current_volunteers = current_volunteers + 1
  WHERE id = event_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_volunteers(event_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE events SET current_volunteers = GREATEST(current_volunteers - 1, 0)
  WHERE id = event_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_hours_to_user(user_id_param UUID, event_id_param UUID)
RETURNS void AS $$
DECLARE
  event_hours INTEGER;
BEGIN
  SELECT duration_hours INTO event_hours FROM events WHERE id = event_id_param;
  UPDATE profiles SET total_hours = COALESCE(total_hours, 0) + event_hours
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_hours_from_user(user_id_param UUID, event_id_param UUID)
RETURNS void AS $$
DECLARE
  event_hours INTEGER;
BEGIN
  SELECT duration_hours INTO event_hours FROM events WHERE id = event_id_param;
  UPDATE profiles SET total_hours = GREATEST(COALESCE(total_hours, 0) - event_hours, 0)
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ТРИГГЕР АВТОМАТИЧЕСКОГО СОЗДАНИЯ ПРОФИЛЯ
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Волонтер'),
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'user_' || LEFT(NEW.id::text, 8))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- RLS ПОЛИТИКИ (ПУБЛИЧНЫЙ ДОСТУП ДЛЯ РАЗРАБОТКИ)
-- ============================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_public" ON events;
CREATE POLICY "events_public" ON events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_public" ON profiles;
CREATE POLICY "profiles_public" ON profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bookings_public" ON bookings;
CREATE POLICY "bookings_public" ON bookings FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- ТЕСТОВЫЕ АККАУНТЫ (15 штук)
-- ============================================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, aud, role)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'vol1@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Анна Волкова","nickname":"anna_volk"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000002', 'vol2@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Дмитрий Соколов","nickname":"dima_sokol"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000003', 'vol3@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Елена Морозова","nickname":"elena_moroz"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000004', 'vol4@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Алексей Петров","nickname":"alex_petr"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000005', 'vol5@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Мария Иванова","nickname":"masha_iva"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000006', 'vol6@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Сергей Козлов","nickname":"serg_koz"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000007', 'vol7@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Ольга Новикова","nickname":"olya_nov"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000008', 'vol8@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Игорь Смирнов","nickname":"igor_smir"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000009', 'vol9@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Татьяна Попова","nickname":"tanya_pop"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000010', 'vol10@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Андрей Васильев","nickname":"andrey_vas"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000011', 'vol11@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Наталья Павлова","nickname":"nata_pav"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000012', 'vol12@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Максим Семенов","nickname":"max_sem"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000013', 'vol13@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Юлия Голубева","nickname":"yulya_gol"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000014', 'vol14@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Павел Виноградов","nickname":"pasha_vin"}', 'authenticated', 'authenticated'),
  ('10000000-0000-0000-0000-000000000015', 'vol15@test.com', crypt('123456', gen_salt('bf')), NOW(), '{"full_name":"Екатерина Богданова","nickname":"katya_bog"}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Профили с разными часами
INSERT INTO profiles (id, full_name, nickname, total_hours) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Анна Волкова', 'anna_volk', 156),
  ('10000000-0000-0000-0000-000000000002', 'Дмитрий Соколов', 'dima_sokol', 142),
  ('10000000-0000-0000-0000-000000000003', 'Елена Морозова', 'elena_moroz', 138),
  ('10000000-0000-0000-0000-000000000004', 'Алексей Петров', 'alex_petr', 125),
  ('10000000-0000-0000-0000-000000000005', 'Мария Иванова', 'masha_iva', 118),
  ('10000000-0000-0000-0000-000000000006', 'Сергей Козлов', 'serg_koz', 105),
  ('10000000-0000-0000-0000-000000000007', 'Ольга Новикова', 'olya_nov', 98),
  ('10000000-0000-0000-0000-000000000008', 'Игорь Смирнов', 'igor_smir', 87),
  ('10000000-0000-0000-0000-000000000009', 'Татьяна Попова', 'tanya_pop', 76),
  ('10000000-0000-0000-0000-000000000010', 'Андрей Васильев', 'andrey_vas', 68),
  ('10000000-0000-0000-0000-000000000011', 'Наталья Павлова', 'nata_pav', 54),
  ('10000000-0000-0000-0000-000000000012', 'Максим Семенов', 'max_sem', 42),
  ('10000000-0000-0000-0000-000000000013', 'Юлия Голубева', 'yulya_gol', 35),
  ('10000000-0000-0000-0000-000000000014', 'Павел Виноградов', 'pasha_vin', 28),
  ('10000000-0000-0000-0000-000000000015', 'Екатерина Богданова', 'katya_bog', 18)
ON CONFLICT (id) DO UPDATE SET total_hours = EXCLUDED.total_hours;

-- ============================================
-- 50 ТЕСТОВЫХ МЕРОПРИЯТИЙ
-- ============================================
INSERT INTO events (title, description, category, city, address, event_date, duration_hours, max_volunteers) VALUES
('Уборка парка Горького', 'Весенняя уборка центрального парка', 'ecology', 'Москва', 'Парк Горького', NOW() + INTERVAL '2 days', 4, 20),
('Помощь в приюте для животных', 'Выгул собак и уборка вольеров', 'animals', 'Санкт-Петербург', 'Приют Доброе сердце', NOW() + INTERVAL '4 days', 3, 10),
('Мастер-класс по оригами', 'Творческий урок для детей', 'social', 'Казань', 'Детский дом №4', NOW() + INTERVAL '5 days', 2, 8),
('Субботник в городском сквере', 'Посадка деревьев и уборка', 'ecology', 'Екатеринбург', 'Сквер на ул. Ленина', NOW() + INTERVAL '3 days', 5, 30),
('Помощь пожилым людям', 'Доставка продуктов и лекарств', 'social', 'Новосибирск', 'ул. Красный проспект 50', NOW() + INTERVAL '1 day', 3, 15),
('Открытый урок английского', 'Бесплатный урок для школьников', 'education', 'Москва', 'Библиотека №12', NOW() + INTERVAL '7 days', 2, 5),
('Донорская акция', 'Организация донорской сдачи крови', 'health', 'Краснодар', 'Центр крови', NOW() + INTERVAL '6 days', 6, 12),
('Фестиваль уличного искусства', 'Помощь в организации фестиваля', 'culture', 'Ростов-на-Дону', 'Набережная Дона', NOW() + INTERVAL '10 days', 8, 40),
('Спортивный день для детей', 'Весёлые старты', 'sport', 'Воронеж', 'Спорткомплекс Олимп', NOW() + INTERVAL '8 days', 4, 20),
('Плетение маскировочных сетей', 'Помощь фронту', 'social', 'Челябинск', 'Волонтерский центр', NOW() + INTERVAL '2 days', 3, 25),
('Посадка деревьев в Битцевском лесу', 'Восстановление лесного массива', 'ecology', 'Москва', 'Битцевский лес', NOW() + INTERVAL '5 days', 4, 25),
('Курсы компьютерной грамотности', 'Обучение пенсионеров', 'education', 'Москва', 'ЦСО Ясенево', NOW() + INTERVAL '3 days', 2, 8),
('Сбор корма для бездомных животных', 'Пункт сбора в ТЦ', 'animals', 'Москва', 'ТЦ Капитолий', NOW() + INTERVAL '2 days', 6, 12),
('Помощь в организации забега', 'Волонтёры на марафоне', 'sport', 'Москва', 'Лужники', NOW() + INTERVAL '14 days', 8, 50),
('Реставрация книг', 'Помощь в библиотеке', 'culture', 'Москва', 'РГБ', NOW() + INTERVAL '7 days', 3, 6),
('Уборка берегов Невы', 'Очистка набережной', 'ecology', 'Санкт-Петербург', 'Набережная Макарова', NOW() + INTERVAL '4 days', 3, 20),
('Помощь в Эрмитаже', 'Организация выставки', 'culture', 'Санкт-Петербург', 'Эрмитаж', NOW() + INTERVAL '10 days', 5, 10),
('Занятия с детьми-сиротами', 'Творческие игры', 'social', 'Санкт-Петербург', 'Детский дом №8', NOW() + INTERVAL '3 days', 3, 8),
('Помощь в собачьем приюте', 'Уход за животными', 'animals', 'Санкт-Петербург', 'Приют Верность', NOW() + INTERVAL '2 days', 4, 12),
('Донорская акция "Капля жизни"', 'Помощь медикам', 'health', 'Санкт-Петербург', 'НМИЦ Алмазова', NOW() + INTERVAL '6 days', 6, 15),
('Уборка озера Кабан', 'Очистка берегов', 'ecology', 'Казань', 'Озеро Кабан', NOW() + INTERVAL '5 days', 4, 18),
('Репетиторство по математике', 'Помощь школьникам', 'education', 'Казань', 'Школа №39', NOW() + INTERVAL '4 days', 2, 5),
('Фестиваль татарской культуры', 'Помощь в организации', 'culture', 'Казань', 'Казанский Кремль', NOW() + INTERVAL '12 days', 8, 30),
('Спортивный праздник для детей', 'Эстафеты и игры', 'sport', 'Казань', 'Стадион Тасма', NOW() + INTERVAL '7 days', 4, 20),
('Субботник в Харитоновском парке', 'Уборка и покраска', 'ecology', 'Екатеринбург', 'Харитоновский парк', NOW() + INTERVAL '3 days', 4, 25),
('Помощь онкобольным детям', 'Досуг в больнице', 'health', 'Екатеринбург', 'ОДКБ №1', NOW() + INTERVAL '2 days', 3, 6),
('Мастер-класс по робототехнике', 'Обучение детей', 'education', 'Екатеринбург', 'Кванториум', NOW() + INTERVAL '5 days', 2, 4),
('Ярмарка вакансий для инвалидов', 'Помощь в трудоустройстве', 'social', 'Екатеринбург', 'ДК Железнодорожников', NOW() + INTERVAL '9 days', 6, 15),
('Уборка Заельцовского парка', 'Сезонная уборка', 'ecology', 'Новосибирск', 'Заельцовский парк', NOW() + INTERVAL '4 days', 3, 20),
('Помощь в хосписе', 'Уход за пациентами', 'health', 'Новосибирск', 'Хоспис №1', NOW() + INTERVAL '2 days', 4, 5),
('Открытый урок китайского языка', 'Бесплатный урок', 'education', 'Новосибирск', 'НГУ', NOW() + INTERVAL '6 days', 2, 15),
('Помощь приюту "Зоосфера"', 'Выгул собак', 'animals', 'Новосибирск', 'Приют Зоосфера', NOW() + INTERVAL '3 days', 3, 10),
('Озеленение улицы Красной', 'Посадка деревьев', 'ecology', 'Краснодар', 'Ул. Красная', NOW() + INTERVAL '5 days', 5, 30),
('Мастер-класс по кубанской кухне', 'Кулинарный урок', 'social', 'Краснодар', 'Детский дом Рождественский', NOW() + INTERVAL '7 days', 3, 6),
('Забег "Краснодарская сотка"', 'Волонтёры на трассе', 'sport', 'Краснодар', 'Парк 30-летия Победы', NOW() + INTERVAL '15 days', 10, 40),
('Уборка набережной Дона', 'Очистка берега', 'ecology', 'Ростов-на-Дону', 'Набережная Дона', NOW() + INTERVAL '4 days', 4, 25),
('Помощь ветеранам ВОВ', 'Уборка квартир', 'social', 'Ростов-на-Дону', 'Совет ветеранов', NOW() + INTERVAL '2 days', 3, 10),
('Фестиваль уличных театров', 'Помощь в организации', 'culture', 'Ростов-на-Дону', 'Парк Горького', NOW() + INTERVAL '11 days', 8, 20),
('Посадка леса "Зеленая зона"', 'Восстановление леса', 'ecology', 'Воронеж', 'Лесопарк Оптимистов', NOW() + INTERVAL '6 days', 6, 35),
('Занятия по финансовой грамотности', 'Обучение подростков', 'education', 'Воронеж', 'Центр Надежда', NOW() + INTERVAL '5 days', 2, 4),
('Помощь в ветклинике', 'Помощь ветеринарам', 'animals', 'Воронеж', 'Ветклиника Айболит', NOW() + INTERVAL '3 days', 4, 3),
('Уборка озера Смолино', 'Очистка пляжа', 'ecology', 'Челябинск', 'Озеро Смолино', NOW() + INTERVAL '4 days', 3, 20),
('Донорская акция на ЧТПЗ', 'Сдача крови', 'health', 'Челябинск', 'МСЧ ЧТПЗ', NOW() + INTERVAL '7 days', 5, 10),
('Очистка Волжского берега', 'Уборка пляжа', 'ecology', 'Самара', 'Пляж Ладья', NOW() + INTERVAL '3 days', 3, 22),
('Творческая мастерская для детей-инвалидов', 'Рисование и лепка', 'social', 'Самара', 'Реабилитационный центр', NOW() + INTERVAL '5 days', 2, 5),
('Вечер настольных игр', 'Досуг для пожилых', 'social', 'Самара', 'Дом престарелых №2', NOW() + INTERVAL '2 days', 3, 8),
('Уборка в Кремле', 'Поддержание чистоты', 'culture', 'Нижний Новгород', 'Нижегородский Кремль', NOW() + INTERVAL '6 days', 4, 15),
('Помощь бездомным', 'Раздача горячей еды', 'social', 'Нижний Новгород', 'Пункт обогрева', NOW() + INTERVAL '1 day', 3, 10),
('Экологический велопробег', 'Организация заезда', 'sport', 'Нижний Новгород', 'Парк Швейцария', NOW() + INTERVAL '10 days', 6, 25),
('Посадка деревьев в парке Победы', 'Озеленение', 'ecology', 'Уфа', 'Парк Победы', NOW() + INTERVAL '5 days', 4, 20);