module.exports = (req, res) => {
  const bookingUrl = process.env.NEXT_PUBLIC_BOOKING_URL;

  if (!bookingUrl) {
    res.status(500).json({ error: 'Booking URL is not configured.' });
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ bookingUrl });
};
