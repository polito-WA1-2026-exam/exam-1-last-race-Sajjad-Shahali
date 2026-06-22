import db from '../db.js';

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function getLines() {
  return all('SELECT * FROM metro_lines');
}

export function getStations() {
  return all('SELECT * FROM stations');
}

export function getSegments() {
  return all('SELECT * FROM segments');
}

export function getSegmentLines() {
  return all('SELECT * FROM segment_lines');
}

export function getLineStations() {
  return all('SELECT * FROM line_stations');
}

export function getEvents() {
  return all('SELECT * FROM events');
}

export function getStationsForPlanning() {
  return all('SELECT id, name, map_x, map_y FROM stations');
}
