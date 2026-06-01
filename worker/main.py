import asyncio
import logging
import os

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


async def run() -> None:
    logger.info("worker iniciado — aguardando implementação (FEAT-08/09)")
    logger.info("CLAUDE_HOME=%s", os.getenv("CLAUDE_HOME", "não definido"))
    while True:
        await asyncio.sleep(60)
        logger.info("worker heartbeat")


if __name__ == "__main__":
    asyncio.run(run())
