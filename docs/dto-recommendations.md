# Рекомендации по DTO (чтение/запись по сценариям)

Документ по итогам разбора текущего API. Цель — убрать лишние данные из тяжёлых ответов,
не плодить дубли и не ломать фронт.

## Что происходит сейчас

| Эндпоинт | Что отдаёт | Проблема |
|---|---|---|
| `GET /api/complexes` | `Page<ResidentialComplexEditDTO>` | **Каталог получает edit-DTO**: на каждую карточку `locationId/districtId/developerId`, все `metroDistances`, **полное дерево `buildings → entrances`**, `keyRenderPath`. Для 25 ЖК это десятки КБ; на 1000 ЖК — мегабайты на один листающий запрос. |
| `GET /api/complexes/{id}` | `ResidentialComplexDetailDTO` | Ок, но `buildings` без дат (их дают только в edit) — из-за этого фронт делает доп. запрос. |
| `GET /api/complexes/{id}/edit` | `ResidentialComplexEditDTO` | Ок как админский DTO, но именно он сейчас раздаётся в каталог. |
| `ResidentialComplexOutDTO` | объявлен | Не используется в list. Дублирует detail (developer/location/district строками). |
| `BuildingInfoDTO`, `EntranceInfoDTO`, `EntranceShortDTO` | три «коротких» DTO секций | `BuildingInfoDTO`, похоже, мёртвый; `EntranceInfoDTO` и `EntranceShortDTO` пересекаются. |

## Рекомендуемая схема (по сценариям, не по сущностям)

### 1. Каталог (сетка / список / карта) — `ComplexCardDTO` (новый, лёгкий)
```
id, name, address, keyRenderPath
developerName, districtName, locationName        // строки для отображения
countBuildings, countEntrance, countApartment
latitude, longitude
metroDistances: [{ stationName, distance }]      // только 2–3 ближайших (ORDER BY distance LIMIT 3)
```
- Без `buildings`, без `*Id`, без `metroStationId` — карточке это не нужно.
- Если карточке нужен фильтр по секции прямо в списке — тогда и только тогда добавляйте `buildings[{id,name,entrances[{id,name}]}]` (как сейчас), но это редкий кейс: фильтры обычно берут из detail.

### 2. Страница ЖК (публичная) — `ComplexDetailDTO`
```
id, name, address, keyRenderPath
developerName, districtName, locationName
latitude, longitude, countBuildings, countEntrance, countApartment
metroDistances: [{ stationName, distance }]      // все, по возрастанию
buildings: [{ id, name, entrances: [{ id, name, maxFloor }] }]   // нужны для фильтров «корпус»/«секция»
completionDate, keyHandoverDate (опционально, если хотите показывать сроки без деталей корпусов)
```
- `locationId/districtId/developerId` не нужны (они для формы редактирования).

### 3. Админка: мастер ЖК — `ComplexEditDTO` (текущий, оставить)
```
id, name, address, locationId, districtId, developerId,
locationName, districtName, developerName,
latitude, longitude, keyRenderPath,
metroDistances: [{ metroStationId, stationName, distance }],
buildings: [{ id, name, completionDate, keyHandoverDate, entrances: [{ id, name, maxFloor }] }]
```
- Это единственный DTO, где нужны id связей и полное дерево — потому что форма редактирования их отправляет назад.

### 4. Ответ на создание — `ComplexShortDTO`
```
id, name, fullAddress, keyRenderPath
```
- `keyRenderPath` стоит добавить: фронт сразу может показать превью, не делая лишний GET.

### 5. Автодополнение — `SearchSuggestionDTO`
```
text, entityType, entityId
```
- Поле `id` в ответе всегда `null` → убрать.

### 6. Квартиры
- Пользовательская таблица — `ApartmentDTO` (текущий ок):
  `id, number, floor, area, price, type, bathroomType, hasBalcony, status, entrance{id,name,building{id,name}}`.
  **Просьба:** добавить в `entrance.building` поля `completionDate` и `keyHandoverDate` —
  тогда фронт не будет делать дополнительный запрос `/{id}/edit` ради «кварталов сдачи/ключей».
- Редактирование — `ApartmentInDTO` (текущий ок для PUT). Для POST заведите `ApartmentCreateDTO` без `id`
  (или `@Null(groups = Create.class)`), иначе клиент обязан прислать id.
- `pricePerSquareMeter` логичнее **считать на бэке** (`price / area`) и отдавать только в out-DTO:
  клиенту не нужно присылать производное поле.

### 7. Справочники
- `MetroStationDTO` → добавить `line` (номер ветки) и, опционально, `color`:
  тогда фронт не держит справочник линий у себя (сейчас у меня локальный `metroLines.js`).
- `DistrictDTO` для `by-location` → отдавать `locationId` вместо вложенного `location{id,name}`
  (объект избыточен, локация и так известна из запроса).

### 8. Что можно удалить/объединить
- `BuildingInfoDTO` — если не используется, удалить.
- `EntranceInfoDTO` и `EntranceShortDTO` — оставить один; для квартир нужен вариант с `building`.
- `ResidentialComplexOutDTO` — либо использовать как detail, либо удалить (сейчас detail-DTO его заменяет).

## Общие принципы

1. DTO — **на сценарий чтения**, а не на сущность: `card` / `detail` / `edit` / `table row`.
2. В списках не отдавайте деревья (`buildings → entrances`) и id связей без необходимости.
3. Коллекции «по интересу» ограничивайте: ближайшие станции метро — top-N в SQL.
4. Считайте агрегаты одним групповым запросом (как у вас `enrichWithMetro`) — иначе N+1 на каждой строке.
5. Для картинок отдавайте **либо ключ, либо готовый публичный URL** — но не оба и не сами байты.
6. Публичные DTO не должны содержать внутренние id, если фронт их не рисует и не отправляет обратно.
7. Изменения без ломки: новые ресурсы (`/complexes` → карточки, `/admin/complexes` → edit) или версия `/api/v2`.

## Что уже стоит поправить в текущих эндпоинтах (мелочи)

- `delete(id)`: `findRenderKeyById(id).orElseThrow()` не даст удалить ЖК **без картинки** — сделайте ключ необязательным
  (удалять объект из S3 только если `key != null`).
- `create`: `keyRenderPath` записывается в сущность после `save()`, но без повторного `save()` —
  проверить, что поле реально попадает в БД (в тесте E2E ключ сохранился, но лучше явно `complexRepo.save(saved)` после установки ключа).
