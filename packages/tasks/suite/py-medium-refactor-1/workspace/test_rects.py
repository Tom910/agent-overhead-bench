import unittest
from rects import total_area, biggest_area

class TestRects(unittest.TestCase):
    def test_rects(self):
        rs = [(2, 3), (4, 1)]
        self.assertEqual(total_area(rs), 10)
        self.assertEqual(biggest_area(rs), 6)

if __name__ == '__main__':
    unittest.main()
