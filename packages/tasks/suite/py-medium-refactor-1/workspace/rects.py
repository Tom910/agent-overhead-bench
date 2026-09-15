def total_area(rects):
    s = 0
    for w, h in rects:
        s += w * h
    return s

def biggest_area(rects):
    m = 0
    for w, h in rects:
        a = w * h
        if a > m:
            m = a
    return m
