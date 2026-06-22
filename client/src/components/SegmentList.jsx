import { useState } from 'react';
import { Form, ListGroup } from 'react-bootstrap';

function SegmentList({ segments = [], selectedSegmentIds = [], onAddSegment, disabled }) {
  const [search, setSearch] = useState('');

  const q = search.toLowerCase();
  const filtered = segments.filter(seg =>
    seg.station_a_name?.toLowerCase().includes(q) ||
    seg.station_b_name?.toLowerCase().includes(q)
  );

  return (
    <div>
      <Form.Control
        className="mb-2"
        size="sm"
        type="text"
        placeholder="Search stations…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <ListGroup>
        {filtered.map(seg => (
          <ListGroup.Item
            key={seg.id}
            action
            disabled={disabled}
            onClick={() => !disabled && onAddSegment(seg.id)}
            style={{ padding: '3px 10px', fontSize: '0.8rem' }}
          >
            {seg.station_a_name} <i className="bi bi-arrow-left-right mx-1"></i> {seg.station_b_name}
          </ListGroup.Item>
        ))}
        {filtered.length === 0 && (
          <ListGroup.Item style={{ fontSize: '0.8rem', padding: '3px 10px' }} className="text-muted">
            No segments match
          </ListGroup.Item>
        )}
      </ListGroup>
    </div>
  );
}

export default SegmentList;
