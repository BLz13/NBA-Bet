import './styles.scss';

import NBA from './assets/nbaWithTextNoBack.svg?react';
import NBASection from './components/NBASection';
import UserSection from './components/UserSection';
import { useState, useEffect } from 'react';

// Proxy API endpoint for NBA stats (Python proxy with nba_api)
// Use relative path for production (works on same domain)
const PROXY_API = '/api/standings';

const normalizeStandings = (standings) => {
  // Handle nba_api LeagueStandingsV3 format
  if (standings?.resultSets && standings.resultSets.length > 0) {
    const resultSet = standings.resultSets[0];
    const headers = resultSet.headers;
    const rows = resultSet.rowSet;

    const teamIdIdx = headers.indexOf('TeamID');
    const teamCityIdx = headers.indexOf('TeamCity');
    const teamNameIdx = headers.indexOf('TeamName');
    const conferenceIdx = headers.indexOf('Conference');
    const winsIdx = headers.indexOf('WINS');
    const lossesIdx = headers.indexOf('LOSSES');
    const winPctIdx = headers.indexOf('WinPCT');
    const streakIdx = headers.indexOf('CurrentStreak');
    const playoffRankIdx = headers.indexOf('PlayoffRank');
    const divisionIdx = headers.indexOf('Division');
    const divisionRecordIdx = headers.indexOf('DivisionRecord');
    const conferenceRecordIdx = headers.indexOf('ConferenceRecord');

    return rows
      .map(row => ({
        id: row[teamIdIdx],
        conference: row[conferenceIdx].trim() === 'East' ? 'Eastern' : row[conferenceIdx].trim() === 'West' ? 'Western' : row[conferenceIdx].trim(),
        city: row[teamCityIdx],
        name: row[teamNameIdx],
        wins: row[winsIdx],
        losses: row[lossesIdx],
        percentage: row[winPctIdx],
        streak: row[streakIdx],
        playoffRank: row[playoffRankIdx],
        division: row[divisionIdx],
        divisionRecord: row[divisionRecordIdx],
        conferenceRecord: row[conferenceRecordIdx],
      }))
      .filter(team => team.conference === 'Western' || team.conference === 'Eastern');
  }
  return [];
};

const getToday = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
}).format(new Date());

const getCachedStandings = () => {
  if (localStorage.getItem('nbaStandingsDate') !== getToday()) {
    return null;
  }
  try {
    return JSON.parse(localStorage.getItem('nbaStandings'));
  } catch {
    return null;
  }
};

function App() {
  const sectionTitles = ['nba', 'bruno', 'nicolas', 'lucas', 'franco'];
  const [westernTeams, setWesternTeams] = useState([]);
  const [easternTeams, setEasternTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStandings = async () => {
      const cached = getCachedStandings();
      if (cached) {
        const normalized = normalizeStandings(cached);
        const west = normalized.filter(t => t.conference === 'Western');
        const east = normalized.filter(t => t.conference === 'Eastern');
        setWesternTeams(west);
        setEasternTeams(east);
        setLoading(false);
        return;
      }

      try {
        const url = `${PROXY_API}?Season=2026-27&SeasonType=Regular%20Season`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const apiStandings = await response.json();
        const normalized = normalizeStandings(apiStandings);

        localStorage.setItem('nbaStandings', JSON.stringify(apiStandings));
        localStorage.setItem('nbaStandingsDate', getToday());

        const west = normalized.filter(t => t.conference === 'Western');
        const east = normalized.filter(t => t.conference === 'Eastern');
        setWesternTeams(west);
        setEasternTeams(east);
      } catch (err) {
        setError(err.message || 'Failed to load NBA standings.');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  if (loading) return <div className="App">Loading...</div>;
  if (error) return <div className="App">Error: {error}</div>;

  // Sort by PlayoffRank within each conference
  const sortedWest = [...westernTeams].sort((a, b) => (a.playoffRank ?? 999) - (b.playoffRank ?? 999));
  const sortedEast = [...easternTeams].sort((a, b) => (a.playoffRank ?? 999) - (b.playoffRank ?? 999));

  return (
    <div className="App">
      <header className="header">
        <span className="nba-icon">
          <NBA alt="NBA Logo" className="nba-logo" />
        </span>
        <h1>Regular Season Bet</h1>
      </header>
      <main>
        {sectionTitles.map((title, index) => (
          <>
            {index === 0 ? (
              <NBASection
                westernTeams={sortedWest}
                easternTeams={sortedEast}
              />
            ) : (
              <div className="user-section">
                <UserSection
                  title={title}
                  isAccordion={index >= 1 && index <= 4}
                  westernTeams={sortedWest}
                  easternTeams={sortedEast}
                />
              </div>
            )}
          </>
        ))}
      </main>
    </div>
  );
}

export default App;