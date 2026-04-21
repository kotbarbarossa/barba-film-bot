import logging
from typing import Literal

import sentry_sdk
from sentry_sdk.integrations import Integration
from sentry_sdk.integrations.arq import ArqIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from app.core.config import settings

AppName = Literal['bot', 'api', 'worker']


def init_sentry(app_name: AppName) -> None:
    if not settings.sentry_dsn:
        return

    integrations: list[Integration] = [
        SqlalchemyIntegration(),
        LoggingIntegration(
            level=logging.INFO,  # INFO -> breadcrumbs
            event_level=logging.ERROR,  # ERROR -> event Sentry
        ),
    ]

    if app_name == 'worker':
        integrations.append(ArqIntegration())

    if app_name == 'api':
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration

        integrations += [StarletteIntegration(), FastApiIntegration()]

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=str(settings.environment),
        integrations=integrations,
        traces_sample_rate=0.1,
        send_default_pii=False,
    )
    sentry_sdk.set_tag('app', app_name)
