import logging

import sentry_sdk
from aiogram import Router
from aiogram.types import ErrorEvent

logger = logging.getLogger(__name__)

router = Router(name='errors')


@router.error()
async def error_handler(event: ErrorEvent) -> None:
    exc = event.exception
    update = event.update

    extra: dict[str, object] = {}
    update_type = 'unknown'

    if update.callback_query:
        update_type = 'callback_query'
        extra['callback_data'] = update.callback_query.data
        extra['user_id'] = update.callback_query.from_user.id

        try:
            await update.callback_query.answer('Произошла ошибка, попробуй ещё раз')
        except Exception:
            pass

    elif update.message:
        update_type = 'message'
        extra['text'] = update.message.text
        extra['user_id'] = update.message.from_user.id if update.message.from_user else None

    with sentry_sdk.new_scope() as scope:
        scope.set_tag('update_type', update_type)
        for key, value in extra.items():
            scope.set_extra(key, value)
        sentry_sdk.capture_exception(exc)

    logger.error(
        'Unhandled error | update_type=%s extra=%s | %s: %s',
        update_type,
        extra,
        type(exc).__name__,
        exc,
        exc_info=exc,
    )
