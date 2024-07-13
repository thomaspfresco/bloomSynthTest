import loading from "../Assets/load.gif"

function Loading() {
  return (
    <div className='loadingScreen'>
            <img src={loading} className='loading' alt=""></img>
    </div>
  );
}

export default Loading;