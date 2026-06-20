import { BookCard } from "./BookCard";
import { MotionTokenReadout } from "./MotionTokenReadout";
import { useTokens } from "./motion/useTokens";
import { BOOKS, BRANDS } from "../data/books";
import { useEffect, useState } from "react";

export const Bookshelf = () => {
  const { currentSet, tokens } = useTokens();
  const brand = BRANDS[currentSet];
  const currentBooks = BOOKS[currentSet];
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoCycle, setAutoCycle] = useState(false);
  const [entranceDone, setEntranceDone] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
    setEntranceDone(false);
    const entranceMs = currentBooks.length * 60 + 360;
    const id = window.setTimeout(() => setEntranceDone(true), entranceMs);
    return () => window.clearTimeout(id);
  }, [currentSet, currentBooks.length]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px), (hover: none) and (pointer: coarse)");
    const sync = () => setAutoCycle(mq.matches);
    sync();

    const tick = () => {
      if (!mq.matches || currentBooks.length < 2) return;
      setActiveIndex((i) => (i + 1) % currentBooks.length);
    };

    const start = () => {
      if (!mq.matches || currentBooks.length < 2) return undefined;
      return window.setInterval(tick, 3000);
    };

    let id = start();
    const onChange = () => {
      sync();
      if (id) window.clearInterval(id);
      setActiveIndex(0);
      id = start();
    };

    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      if (id) window.clearInterval(id);
    };
  }, [currentBooks.length, currentSet]);

  return (
    <div className="bookshelf">
      <div className="bookshelf-top">
        <header className="bookshelf-header">
          <p className="bookshelf-imprint">{brand.name}</p>
          <p className="bookshelf-genre">{brand.tagline}</p>
          <h2 className="bookshelf-title">{brand.shelfTitle}</h2>
          <p className="bookshelf-lead">{brand.shelfLead}</p>
        </header>

        <MotionTokenReadout
          brandName={brand.name}
          currentSet={currentSet}
          tokenSet={tokens[currentSet]}
        />
      </div>

      <div className="bookshelf-grid">
        {currentBooks.map((book, index) => (
          <BookCard
            key={book.id}
            cover={book.cover}
            title={book.title}
            description={`${book.author} · ${book.description}`}
            variant={currentSet}
            index={index}
            autoHighlight={autoCycle && entranceDone && activeIndex === index}
          />
        ))}
      </div>
    </div>
  );
};
