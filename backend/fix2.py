with open('tests/test_orders.py', 'r') as f:
    text = f.read()

text = text.replace('"/api/v1/orders/"', '"/api/v1/orders"')
text = text.replace('"/api/v1/reviews/"', '"/api/v1/reviews"')

with open('tests/test_orders.py', 'w') as f:
    f.write(text)
