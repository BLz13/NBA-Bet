import { useEffect, useState } from 'react';

import { USER_DATA } from '../assets/userData';

// Import all team logos
const teamLogos = import.meta.glob('../assets/*.svg', { eager: true, as: 'url' });

const getTeamLogo = (teamName) => {
  const normalized = teamName.toLowerCase();
  const key = `../assets/${normalized}.svg`;
  return teamLogos[key] || '';
};

// Proxy API endpoint for NBA stats (Python proxy with nba_api)
// Use relative path for production (works on same domain)
const PROXY_API = '/api/leaders';

const fetchCategoryLeaders = async (season, category) => {
  const statCategoryMap = {
    points: 'PTS',
    rebounds: 'REB',
    assists: 'AST',
    steals: 'STL',
    blocks: 'BLK',
  };
  const statCategory = statCategoryMap[category];
  if (!statCategory) return null;

  try {
    console.log(`[fetchCategoryLeaders] Fetching ${category} for season ${season}`);
    const response = await fetch(`${PROXY_API}?Season=${encodeURIComponent(season)}&StatCategory=${statCategory}&PerMode=PerGame&SeasonType=Regular%20Season`);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[fetchCategoryLeaders] Error response for ${category}:`, text);
      return null;
    }

    const data = await response.json();
    console.log(`[fetchCategoryLeaders] ${category} data:`, data);

    // NBA Stats API returns data in resultSets format
    const resultSet = data.resultSets?.[0];
    if (!resultSet || !resultSet.rowSet || resultSet.rowSet.length === 0) {
      console.warn(`[fetchCategoryLeaders] No data for ${category}`);
      return null;
    }

    const headers = resultSet.headers;
    const rows = resultSet.rowSet;

    // Map column indices
    const nameIdx = headers.indexOf('PLAYER');
    const teamIdx = headers.indexOf('TEAM');
    const valueIdx = headers.indexOf(statCategory);

    if (nameIdx === -1 || teamIdx === -1 || valueIdx === -1) {
      console.warn(`[fetchCategoryLeaders] Missing columns for ${category}`);
      return null;
    }

    // Return top leader (first row)
    const topRow = rows[0];
    return {
      name: topRow[nameIdx],
      team: topRow[teamIdx],
      value: topRow[valueIdx],
    };
  } catch (err) {
    console.error(`[fetchCategoryLeaders] Failed to fetch ${category}:`, err);
    return null;
  }
};

// Helper: Normalize name by removing diacritics/accents for fuzzy matching
// e.g., "Luka Dončić" → "luka doncic", "Nikola Jokić" → "nikola jokic"
const normalizeName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')           // Decompose accented characters
    .replace(/[̀-ͯ]/g, '') // Remove diacritical marks
    .replace(/[^a-z0-9\s]/g, '');    // Remove any remaining special chars
};

const NBASection = ({ westernTeams, easternTeams }) => {
  const [leaders, setLeaders] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch NBA season leaders from proxy API
  useEffect(() => {
    const fetchLeaders = async () => {
      // Current season 2026-27
      console.log('[NBASection] Fetching season leaders for 2026-27...');
      const categories = ['points', 'rebounds', 'assists', 'steals', 'blocks'];
      const leadersData = {};

      for (const cat of categories) {
        const leader = await fetchCategoryLeaders('2026-27', cat);
        console.log(`[NBASection] ${cat} leader:`, leader);
        if (leader) {
          leadersData[cat] = leader;
        }
      }
      console.log('[NBASection] Final leaders data:', leadersData);
      setLeaders(leadersData);
      setLoading(false);
    };
    fetchLeaders();
  }, []);

  if (loading) return <div className="section">Loading NBA data...</div>;

  const pct = (w, l) => w + l > 0 ? ((w / (w + l)) * 100).toFixed(1) : '0.0';

  // Calculate points for each user (standings)
  const calculateUserPoints = (userPredictions, actualWest, actualEast) => {
    let totalPoints = 0;

    // Process Western conference
    userPredictions.west.forEach((predictedTeam, predIndex) => {
      const predictedPosition = predIndex + 1;
      const actualPosition = actualWest.findIndex(t => t.name === predictedTeam) + 1;

      if (actualPosition === 0) return; // team not found

      // Regla 1: Category match
      const predictedInPlayoffs = predictedPosition <= 6;
      const predictedInPlayIn = predictedPosition >= 7 && predictedPosition <= 10;
      const actualInPlayoffs = actualPosition <= 6;
      const actualInPlayIn = actualPosition >= 7 && actualPosition <= 10;

      if (predictedInPlayoffs && actualInPlayoffs) totalPoints += 1;
      if (predictedInPlayIn && actualInPlayIn) totalPoints += 1;

      // Regla 2: Position accuracy
      const diff = Math.abs(predictedPosition - actualPosition);
      if (diff === 0) totalPoints += 4;
      else if (diff === 1) totalPoints += 2;
      else if (diff === 2) totalPoints += 1;
    });

    // Process Eastern conference
    userPredictions.east.forEach((predictedTeam, predIndex) => {
      const predictedPosition = predIndex + 1;
      const actualPosition = actualEast.findIndex(t => t.name === predictedTeam) + 1;

      if (actualPosition === 0) return; // team not found

      // Regla 1: Category match
      const predictedInPlayoffs = predictedPosition <= 6;
      const predictedInPlayIn = predictedPosition >= 7 && predictedPosition <= 10;
      const actualInPlayoffs = actualPosition <= 6;
      const actualInPlayIn = actualPosition >= 7 && actualPosition <= 10;

      if (predictedInPlayoffs && actualInPlayoffs) totalPoints += 1;
      if (predictedInPlayIn && actualInPlayIn) totalPoints += 1;

      // Regla 2: Position accuracy
      const diff = Math.abs(predictedPosition - actualPosition);
      if (diff === 0) totalPoints += 4;
      else if (diff === 1) totalPoints += 2;
      else if (diff === 2) totalPoints += 1;
    });

    return totalPoints;
  };

  // Calculate leader points for each user
  const calculateLeaderPoints = (userLeaders, actualLeaders) => {
    if (!actualLeaders || Object.keys(actualLeaders).length === 0) return 0;

    let totalPoints = 0;
    const categories = ['points', 'rebounds', 'assists', 'steals', 'blocks'];

    categories.forEach((category) => {
      const predictedPlayer = userLeaders[category];
      const actualLeader = actualLeaders[category];

      if (predictedPlayer && actualLeader) {
        // Normalize names for comparison (handles diacritics: Dončić → Doncic)
        const predictedNormalized = normalizeName(predictedPlayer);
        const actualNormalized = normalizeName(actualLeader.name);

        if (predictedNormalized === actualNormalized) {
          totalPoints += 5; // 5 points for exact leader match
        }
      }
    });

    return totalPoints;
  };

  // Calculate points for all users
  const userPoints = Object.entries(USER_DATA).map(([key, data]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    standingPoints: calculateUserPoints(data, westernTeams, easternTeams),
    leaderPoints: calculateLeaderPoints(data.leaders, leaders),
  })).map(user => ({
    ...user,
    totalPoints: user.standingPoints + user.leaderPoints
  })).sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="nba-section">

      <div className="table-positions">
        <h2>Positions</h2>
        <ol>
          {userPoints.map((user, index) => (
            <li key={user.name}>
              <a href={`#${user.name.toLowerCase()}`} className="user-name">{user.name}:</a>
              <span className="user-points">
                {user.totalPoints} pts
                <span className="points-breakdown">
                  ( Standings: {user.standingPoints} + Leaders: {user.leaderPoints} )
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="current-leaders">

        <h2>Season Leaders</h2>

        {Object.keys(leaders).length > 0 && (

          <div className="leaders-categories">

            {['points', 'rebounds', 'assists', 'steals', 'blocks'].map(category => {

              const actual = leaders[category];
              const actualName = actual ? actual.name : 'N/A';
              const actualValue = actual ? actual.value : 'N/A';
              const actualTeam = actual ? actual.team : '';

              return (
                <div key={category} className="leader-card">

                  <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>

                  <h4 className="leader-actual">
                    <span className="label">Current:</span>
                    <span className="value">{actualName} ({actualTeam}) - {actualValue} {category}/g</span>
                  </h4>

                  <div className="leader-predictions">
                    <h4 className="label">Predictions:</h4>
                    {Object.entries(USER_DATA).map(([key, data]) => {
                      const predicted = data.leaders[category];
                      const isCorrect = predicted && actual && normalizeName(predicted) === normalizeName(actual.name);
                      return (
                        <span key={key} className={isCorrect ? 'prediction correct' : 'prediction'}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}: {predicted}
                        </span>
                      );
                    })}
                  </div>

                </div>
              );
            })}

          </div>

        )}

      </div>

      <div className="current-standings">
        <h2>NBA Current Standings</h2>

        <div>
          <h3>Western Conference</h3>
          <ol>
            <li>
              <span>team</span>
              <span>%</span>
              <span>w</span>
              <span>l</span>
              <span>s</span>
            </li>
            {westernTeams.map((team) => (
              <li key={team.id}>
                <span>
                  {getTeamLogo(team.name) && <img src={getTeamLogo(team.name)} alt={team.name} />}
                <span>
                  <span className="team-city">{team.city}</span>
                  <span className="team-name">{team.name}</span>
                </span>
                </span>
                <span>{pct(team.wins, team.losses)}</span>
                <span>{team.wins}</span>
                <span>{team.losses}</span>
                <span>{team.streak}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3>Eastern Conference</h3>
          <ol>
            <li>
              <span>team</span>
              <span>%</span>
              <span>w</span>
              <span>l</span>
              <span>s</span>
            </li>
            {easternTeams.map((team) => (
              <li key={team.id}>
                <span>
                  {getTeamLogo(team.name) && <img src={getTeamLogo(team.name)} alt={team.name} />}
                <span>
                  <span className="team-city">{team.city}</span>
                  <span className="team-name">{team.name}</span>
                </span>
                </span>
                <span>{pct(team.wins, team.losses)}</span>
                <span>{team.wins}</span>
                <span>{team.losses}</span>
                <span>{team.streak}</span>
              </li>
            ))}
          </ol>
        </div>

      </div>

    </div>
  );
};

export default NBASection;