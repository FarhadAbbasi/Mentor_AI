
const ShotStackTransitions = ({ selectedTransition, setSelectedTransition }) => {
  // List of available transitions
  const transitions = [
    "fade",
    "zoom",
    "reveal",
    "wipeLeft",
    "wipeRight",
    "slideUp",
    "slideDown",
    "slideLeft",
    "slideRight",
    "carouselLeft",
    "carouselRight",
    "shuffleTopLeft",
    "shuffleTopRight",
    "shuffleBottomLeft",
    "shuffleBottomRight",
  ];
// console.log('Selected Transitions:', selectedTransition);


  return (
    <div className="m-2 p-2 bg-slate-700/80 rounded shadow-xl">
      <select
        className="bg-sky-600 text-white p-2 m-2 items-center rounded-md shadow-xl"
        value={selectedTransition}
        onChange={(e) => setSelectedTransition(e.target.value)}
      >
        {transitions.map((transition, index) => (
          <option key={index} value={transition} className="bg-slate-700 shadow-xl">
            {transition}
          </option>
        ))}
      </select>
      {/* <p>Selected Transition: {selectedTransition}</p> */}
    </div>
  );
};

export default ShotStackTransitions;
