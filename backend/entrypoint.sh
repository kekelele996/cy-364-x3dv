#!/bin/sh
set -e

# 等待数据库就绪并同步 Prisma 模型（建表）
echo "[entrypoint] 同步数据库结构 (prisma db push)..."
n=0
until npx prisma db push --skip-generate --accept-data-loss; do
  n=$((n + 1))
  if [ "$n" -ge 30 ]; then
    echo "[entrypoint] 数据库在限定时间内不可用，退出" >&2
    exit 1
  fi
  echo "[entrypoint] 数据库尚未就绪，2 秒后重试 ($n/30)..."
  sleep 2
done

# 幂等初始化演示数据
echo "[entrypoint] 执行数据种子..."
node dist/prisma/seed.js || echo "[entrypoint] 种子执行跳过/失败，继续启动"

exec node dist/main.js
