/**
 * Accepts the connection string exactly as the Azure portal shows it (ODBC or ADO.NET style) and converts it
 * to Prisma's SQL Server URL. Strings already in `sqlserver://…` form are returned unchanged.
 *
 *   Driver={ODBC Driver 18 for SQL Server};Server=tcp:x.database.windows.net,1433;Database=db;Uid=u;Pwd={p};Encrypt=yes;...
 *   → sqlserver://x.database.windows.net:1433;database=db;user=u;password={p};encrypt=true;trustServerCertificate=false;loginTimeout=30
 */

const SPECIAL = /[:\\=;/[\]{}]/;

/** Splits `key=value;` pairs, honouring `{...}` quoted values (where `}}` is a literal `}`). */
function parsePairs(input: string): Map<string, string> {
  const pairs = new Map<string, string>();
  let i = 0;
  while (i < input.length) {
    const eq = input.indexOf('=', i);
    if (eq === -1) break;
    const key = input.slice(i, eq).trim().toLowerCase().replace(/\s+/g, '');
    let j = eq + 1;
    let value = '';
    if (input[j] === '{') {
      j++;
      while (j < input.length) {
        if (input[j] === '}' && input[j + 1] === '}') {
          value += '}';
          j += 2;
        } else if (input[j] === '}') {
          j++;
          break;
        } else {
          value += input[j++];
        }
      }
      const semi = input.indexOf(';', j);
      j = semi === -1 ? input.length : semi;
    } else {
      const semi = input.indexOf(';', j);
      const end = semi === -1 ? input.length : semi;
      value = input.slice(j, end).trim();
      j = end;
    }
    if (key) pairs.set(key, value);
    i = j + 1;
  }
  return pairs;
}

const truthy = (v: string) => ['yes', 'true', '1', 'mandatory', 'strict'].includes(v.trim().toLowerCase());

export function normalizeDatabaseUrl(raw: string): string {
  const value = raw.trim().replace(/^["']|["']$/g, '');
  if (/^sqlserver:\/\//i.test(value)) return value;

  const pairs = parsePairs(value);
  const get = (...keys: string[]) => keys.map((k) => pairs.get(k)).find((v) => v !== undefined && v !== '');

  const server = get('server', 'datasource', 'address', 'addr');
  if (!server) {
    throw new Error('DATABASE_URL is not a recognised SQL Server connection string (expected sqlserver://… or the Azure ODBC/ADO.NET string)');
  }
  const [host = '', port = '1433'] = server.replace(/^tcp:/i, '').split(',').map((s) => s.trim());
  const quote = (v: string, always = false) => (always || SPECIAL.test(v) ? `{${v}}` : v);

  const params: string[] = [];
  const database = get('database', 'initialcatalog');
  const user = get('uid', 'userid', 'user', 'username');
  const password = get('pwd', 'password');
  if (database) params.push(`database=${quote(database)}`);
  if (user) params.push(`user=${quote(user)}`);
  if (password) params.push(`password=${quote(password, true)}`);
  params.push(`encrypt=${truthy(get('encrypt') ?? 'true')}`);
  params.push(`trustServerCertificate=${truthy(get('trustservercertificate') ?? 'false')}`);
  // Serverless / free-tier Azure SQL can take up to a minute to resume from auto-pause.
  const timeout = Math.max(60, Number.parseInt(get('connectiontimeout', 'logintimeout', 'connecttimeout') ?? '60', 10) || 60);
  params.push(`loginTimeout=${timeout}`);

  return [`sqlserver://${host}:${port}`, ...params].join(';');
}
