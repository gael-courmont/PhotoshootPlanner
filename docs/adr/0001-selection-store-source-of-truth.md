# The selection store is the source of truth; the URL is a one-way mirror

The Selection lives in a client store. The URL query (`pkg`, `start`, `spots`) is read once on first load to seed the store, sanitized against the known package and spot ids, and from then on is only written to, never read back. Two-way sync was rejected: it makes every store change a navigation candidate, needs loop guards, and forces pages to be dynamic to read the query on the server.

The store keeps the other spots in insertion order. The Route order is not stored: it is derived later by a pure function from the Selection and the legs. Keeping the order out of the store means the Selection stays a plain, shareable choice, and a change to the routing rule never invalidates stored or linked state.
