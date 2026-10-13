import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');
const rawDb = new sqlite3.Database(dbPath);

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    rawDb.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    rawDb.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    rawDb.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

export function exec(sql) {
  return new Promise((resolve, reject) => {
    rawDb.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

const initSql = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf-8');
await exec(initSql);

// 迁移：为旧库的 conditions 表补充 duration_minutes 列
const condCols = await all("PRAGMA table_info(conditions)");
if (!condCols.some((c) => c.name === 'duration_minutes')) {
  await exec("ALTER TABLE conditions ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 30");
}

// 迁移：为 quests 补充 quest_date 列（关卡只在设定当天出现），并清理「每日重复」跨日生成的非奖励池计划
const questCols = await all("PRAGMA table_info(quests)");
if (!questCols.some((c) => c.name === 'quest_date')) {
  await exec("ALTER TABLE quests ADD COLUMN quest_date TEXT");
  await exec("UPDATE quests SET quest_date = date(created_at) WHERE quest_date IS NULL");
  await exec(`
    DELETE FROM condition_completions WHERE daily_plan_id IN (
      SELECT dp.id FROM daily_plans dp JOIN quests q ON q.id = dp.quest_id
      WHERE dp.is_reward_pool = 0 AND q.quest_date != dp.plan_date
    );
    DELETE FROM reward_sessions WHERE daily_plan_id IN (
      SELECT dp.id FROM daily_plans dp JOIN quests q ON q.id = dp.quest_id
      WHERE dp.is_reward_pool = 0 AND q.quest_date != dp.plan_date
    );
    DELETE FROM daily_plans WHERE is_reward_pool = 0 AND EXISTS (
      SELECT 1 FROM quests q WHERE q.id = daily_plans.quest_id AND q.quest_date != daily_plans.plan_date
    );
  `);
}

await exec("PRAGMA foreign_keys = ON;");
