# Необходимые изменения на бекенде

## Проблема
На бекенде есть эндпоинты, которые возвращают HTML-страницы. Это нарушает принцип разделения фронтенда и бекенда. Все UI должно рендериться на фронтенде.

## Изменения в AuthPublicController

### ❌ Удалить этот эндпоинт:

```java
@GetMapping(value = "/verify", produces = MediaType.TEXT_HTML_VALUE)
public ResponseEntity<String> verifyPage(@RequestParam("token") String token) {
    try {
        authService.verifyUserEmail(token);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(htmlTemplates.emailVerificationSuccess());
    } catch (IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.TEXT_HTML)
                .body(htmlTemplates.emailVerificationError());
    }
}
```

### ✅ Оставить только JSON эндпоинт:

```java
@PostMapping("/verify")
public ResponseEntity<Void> verify(@RequestParam("token") String token) {
    authService.verifyUserEmail(token);
    return ResponseEntity.noContent().build();
}
```

## Изменения в Email-шаблонах

### Email-письма должны содержать ссылки на ФРОНТЕНД, а не на бекенд:

**Было (неправильно):**
```
http://localhost:8083/api/auth/verify?token=abc123
```

**Должно быть (правильно):**
```
http://localhost:5173/verify?token=abc123
```

### Где изменить:

Найдите в коде бекенда место, где формируются email-письма для верификации. Обычно это:
- `EmailService` или `MailService`
- Email templates (Thymeleaf, FreeMarker, или просто строки)

Измените URL в письмах:
- **Для локальной разработки:** `http://localhost:5173/verify?token={token}`
- **Для продакшена:** `https://your-domain.com/verify?token={token}`

### Рекомендация:

Добавьте в `application.properties` или `application.yml`:

```properties
# Frontend URL for email links
app.frontend.url=http://localhost:5173
```

И используйте эту переменную при формировании ссылок в письмах:

```java
String verificationUrl = frontendUrl + "/verify?token=" + token;
```

## Проверка изменений

После внесения изменений:

1. ✅ Регистрация нового пользователя
2. ✅ Получение email с ссылкой на фронтенд
3. ✅ Клик по ссылке открывает фронтенд страницу `/verify?token=...`
4. ✅ Фронтенд вызывает `POST /api/auth/verify?token=...`
5. ✅ Успешная верификация и редирект на логин

## Дополнительно

Если есть другие HTML-эндпоинты (например, для сброса пароля), их тоже нужно убрать и использовать только JSON API.

### Принцип:
- **Бекенд** = только JSON API
- **Фронтенд** = вся UI логика и рендеринг

