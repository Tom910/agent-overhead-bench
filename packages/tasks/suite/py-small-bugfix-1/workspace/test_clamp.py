import unittest
from clamp import clamp

class TestClamp(unittest.TestCase):
    def test_clamp(self):
        self.assertEqual(clamp(5, 0, 10), 5)
        self.assertEqual(clamp(-1, 0, 10), 0)
        self.assertEqual(clamp(11, 0, 10), 10)
        self.assertEqual(clamp(10, 0, 10), 10)

if __name__ == '__main__':
    unittest.main()
