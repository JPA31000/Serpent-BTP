import curses
from curses import KEY_RIGHT, KEY_LEFT, KEY_UP, KEY_DOWN
from random import randint


def main(stdscr):
    curses.curs_set(0)
    height, width = 20, 60
    win = curses.newwin(height, width, 0, 0)
    win.keypad(1)
    win.timeout(100)

    snk_x = width // 4
    snk_y = height // 2
    snake = [
        [snk_y, snk_x],
        [snk_y, snk_x - 1],
        [snk_y, snk_x - 2]
    ]
    food = [height // 2, width // 2]
    win.addch(food[0], food[1], curses.ACS_PI)

    key = KEY_RIGHT

    while True:
        next_key = win.getch()
        key = key if next_key == -1 else next_key

        if key == KEY_RIGHT:
            new_head = [snake[0][0], snake[0][1] + 1]
        elif key == KEY_LEFT:
            new_head = [snake[0][0], snake[0][1] - 1]
        elif key == KEY_UP:
            new_head = [snake[0][0] - 1, snake[0][1]]
        elif key == KEY_DOWN:
            new_head = [snake[0][0] + 1, snake[0][1]]
        else:
            continue

        snake.insert(0, new_head)

        if (
            snake[0][0] in [0, height - 1] or
            snake[0][1] in [0, width - 1] or
            snake[0] in snake[1:]
        ):
            break

        if snake[0] == food:
            food = None
            while food is None:
                nf = [randint(1, height - 2), randint(1, width - 2)]
                if nf not in snake:
                    food = nf
            win.addch(food[0], food[1], curses.ACS_PI)
        else:
            tail = snake.pop()
            win.addch(tail[0], tail[1], ' ')

        win.addch(snake[0][0], snake[0][1], curses.ACS_CKBOARD)

    curses.endwin()
    print("Game Over!")


if __name__ == "__main__":
    curses.wrapper(main)

