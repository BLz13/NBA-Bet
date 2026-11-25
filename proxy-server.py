import sys
import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from nba_api.stats.endpoints import leagueleaders, leaguestandingsv3
import traceback

# Force unbuffered output
sys.stdout = open(sys.stdout.fileno(), 'w', buffering=1)

app = Flask(__name__, static_folder='dist')
CORS(app)

@app.route('/api/leaders')
def get_leaders():
    try:
        season = request.args.get('Season', '2023-24')
        season_type = request.args.get('SeasonType', 'Regular Season')
        stat_category = request.args.get('StatCategory', 'PTS')
        per_mode = request.args.get('PerMode', 'PerGame')

        print(f"[Python Proxy] Fetching leaders for season: {season}, type: {season_type}, stat: {stat_category}", flush=True)

        # Use nba_api to fetch league leaders with correct parameters
        leaders = leagueleaders.LeagueLeaders(
            league_id='00',
            per_mode48=per_mode,
            scope='S',
            season=season,
            season_type_all_star=season_type,
            stat_category_abbreviation=stat_category
        )

        # Get the data as a DataFrame
        df = leaders.get_data_frames()[0]
        print(f"[Python Proxy] Got {len(df)} players", flush=True)
        print(f"[Python Proxy] Columns: {df.columns.tolist()}", flush=True)
        if len(df) > 0:
            print(f"[Python Proxy] First row: {df.iloc[0].to_dict()}", flush=True)

        # Replace NaN/Inf with None BEFORE converting to list (handles numpy types)
        df = df.astype(object).fillna(value=None)
        df = df.replace([float('inf'), float('-inf')], None)

        # Return in NBA Stats API format for compatibility
        headers = df.columns.tolist()
        row_set = df.values.tolist()

        return jsonify({
            'resultSets': [{
                'name': 'LeagueLeaders',
                'headers': headers,
                'rowSet': row_set
            }]
        })
    except Exception as e:
        print(f"[Python Proxy] Error: {e}", flush=True)
        print(f"[Python Proxy] Traceback: {traceback.format_exc()}", flush=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/standings')
def get_standings():
    print(f"[get_standings] ENTRY - request received", flush=True)
    try:
        season = request.args.get('Season', '2026-27')
        season_type = request.args.get('SeasonType', 'Regular Season')

        print(f"[Python Proxy] Fetching standings for season: {season}, type: {season_type}", flush=True)

        # Use nba_api to fetch league standings
        standings = leaguestandingsv3.LeagueStandingsV3(
            league_id='00',
            season=season,
            season_type=season_type
        )

        # Get the data as a DataFrame
        df = standings.get_data_frames()[0]
        print(f"[Python Proxy] Got {len(df)} teams", flush=True)
        print(f"[Python Proxy] Columns: {df.columns.tolist()}", flush=True)
        if len(df) > 0:
            print(f"[Python Proxy] First row: {df.iloc[0].to_dict()}", flush=True)

        # Convert to object dtype then fillna to replace NaN/Inf with None
        df = df.astype(object).fillna(value=None)
        df = df.replace([float('inf'), float('-inf')], None)

        # Return in NBA Stats API format for compatibility
        headers = df.columns.tolist()
        row_set = df.values.tolist()

        return jsonify({
            'resultSets': [{
                'name': 'LeagueStandings',
                'headers': headers,
                'rowSet': row_set
            }]
        })
    except Exception as e:
        print(f"[Python Proxy] Error: {e}", flush=True)
        print(f"[Python Proxy] Traceback: {traceback.format_exc()}", flush=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok'})

# Serve React build static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3001))
    print(f"Starting NBA Stats Proxy on port {port}", flush=True)
    print("Endpoints:", flush=True)
    print("  GET /api/leaders?Season=2026-27&StatCategory=PTS", flush=True)
    print("  GET /api/leaders?Season=2026-27&StatCategory=REB", flush=True)
    print("  GET /api/leaders?Season=2026-27&StatCategory=AST", flush=True)
    print("  GET /api/leaders?Season=2026-27&StatCategory=STL", flush=True)
    print("  GET /api/leaders?Season=2026-27&StatCategory=BLK", flush=True)
    print("  GET /api/standings?Season=2026-27&SeasonType=Regular%20Season", flush=True)
    print("  GET /api/health", flush=True)
    app.run(host='0.0.0.0', port=port, debug=False)