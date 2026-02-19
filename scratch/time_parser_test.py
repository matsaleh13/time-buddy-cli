import unittest
from time_parser import parse_expression

class TestParser(unittest.TestCase):

    def test_now(self):
        expr = 'now'
        result = parse_expression(expr)
        self.assertRegex(result, r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$')

    def test_time_duration(self):
        expr = '2:30:00 + 1:15:30'
        result = parse_expression(expr)
        self.assertEqual(result, '3:45:30')

    def test_date_duration(self):
        expr = '2023-05-01 - 2023-04-01'
        result = parse_expression(expr)
        self.assertEqual(result, '30 days, 0:00:00')

    def test_total_seconds(self):
        expr = '1:30:00 * 2'
        result = parse_expression(expr)
        self.assertEqual(result, '3:00:00')

    def test_division(self):
        expr = '2:00:00 / 3'
        result = parse_expression(expr)
        self.assertEqual(result, '0:40:00')

    def test_invalid_operator(self):
        expr = '2:30:00 & 1:15:30'
        with self.assertRaises(ValueError):
            parse_expression(expr)

if __name__ == '__main__':
    unittest.main()
