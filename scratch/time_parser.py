from datetime import datetime, timedelta

def parse_expression(expr):
    now = datetime.now()
    parts = [p.strip() for p in expr.split(' ')]
    value1 = parse_value(parts[0], now)
    operator = parts[1]
    value2 = parse_value(parts[2], now)
    result = perform_operation(value1, operator, value2)
    if isinstance(result, datetime):
        return result.strftime('%Y-%m-%d %H:%M:%S')
    else:
        return str(result)


def parse_value(value_str, now):
    if value_str == 'now':
        return now
    elif ':' in value_str:
        # time duration
        parts = value_str.split(':')
        if len(parts) == 4:
            return timedelta(days=int(parts[0]), hours=int(parts[1]), minutes=int(parts[2]), seconds=int(parts[3]))
        elif len(parts) == 3:
            return timedelta(days=0, hours=int(parts[0]), minutes=int(parts[1]), seconds=int(parts[2]))
        else:
            raise ValueError(f'Invalid time duration format: {value_str}')
    elif '-' in value_str:
        # date value
        return datetime.strptime(value_str, '%Y-%m-%d').date()
    else:
        # assume it's a duration value
        parts = value_str.split(':')
        return timedelta(days=int(parts[0]), hours=int(parts[1]), minutes=int(parts[2]), seconds=int(parts[3]))


def perform_operation(value1, operator, value2):
    if operator == '+':
        return value1 + value2
    elif operator == '-':
        if isinstance(value1, datetime) and isinstance(value2, datetime):
            return value1 - value2
        else:
            return value1 - value2
    elif operator == '*':
        return value1 * int(value2.total_seconds())
    elif operator == '/':
        return value1 / int(value2.total_seconds())
    else:
        raise ValueError(f'Unknown operator: {operator}')
