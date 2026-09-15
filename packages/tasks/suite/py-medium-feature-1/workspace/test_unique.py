import unittest
from pkg.unique import unique

class TestUnique(unittest.TestCase):
    def test_unique(self):
        self.assertEqual(unique([1, 2, 1, 3]), [1, 2, 3])
        self.assertEqual(unique([]), [])

if __name__ == '__main__':
    unittest.main()
