port module Main exposing (Model, Msg(..), init, main, subscriptions, update, view)

-- port module Main exposing (Model, Msg(..), init, main, subscriptions, timeToString, update, view)

import Browser
import Css
import Debug exposing (log)
import Dict exposing (Dict)
import Html exposing (Attribute, Html, br, button, div, input, li, ol, span, text, label)
import Html.Attributes exposing (attribute, class, placeholder, style, value)
import Html.Events exposing (on, onClick, onInput)
import Html.Events.Extra exposing (targetValueIntParse)
import Html.Lazy exposing (lazy, lazy2, lazy3)
import Http
import Json.Decode as Decode
import Json.Encode as Encode
import List.Extra exposing (getAt)
import Platform.Cmd as Cmd
import Url.Builder exposing (relative)


-- elm bootstrap: http://elm-bootstrap.info/popover
-- source code: https://github.com/rundis/elm-bootstrap/
-- popover usage code: https://github.com/rundis/elm-bootstrap.info/blob/master/src/Page/Popover.elm
import Bootstrap.Popover as Popover
import Bootstrap.Button as Button
-- input group usage code: https://github.com/rundis/elm-bootstrap.info/blob/master/src/Page/Popover.elm
import Bootstrap.Form as Form
import Bootstrap.Form.Input as Input
import Bootstrap.Form.InputGroup as InputGroup

-- MAIN


main =
    Browser.element
        { init = init
        , subscriptions = subscriptions
        , update = update
        , view = view
        }



-- MODEL


type alias KeyCandidate =
    { word : String
    , metadata : String
    , freq : List Int
    }


type alias Frequency =
    List Int


type alias Model =
    { keyword : String
    , userMessage : Dict String String
    , synonyms : List KeyCandidate
    , popoverStateSimilarity : Popover.State
    , popoverState : Popover.State
    }


defaultModel =
    { keyword = ""
    , userMessage = Dict.empty
    , synonyms = []
    , popoverStateSimilarity = Popover.initialState
    , popoverState = Popover.initialState
    }


init : () -> ( Model, Cmd Msg )
init _ =
    -- update NextWorkElement model
    ( defaultModel, Cmd.none )



-- PORTS


port sendMessage : Encode.Value -> Cmd msg


port messageReceiver : (Decode.Value -> msg) -> Sub msg



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch [ messageReceiver Recv ]


portEncoder : Model -> Encode.Value
portEncoder model =
    Encode.object
        [ ( "keyword", Encode.string model.keyword )
        ]


type alias MsgDecoded =
    { keyword : String }


portDecoder : Decode.Decoder MsgDecoded
portDecoder =
    Decode.map MsgDecoded
        (Decode.field "keyword" Decode.string)



-- UPDATE


type
    Msg
    -- synonyms
    = SelectSynonym Int
    -- | SortSynonymsByFreq
    | SortSynonymsByOrigin
      -- Http responses
    | SynonymsReady (Result Http.Error (List KeyCandidate))
      -- input/output?
    | KeywordInput String
      -- ports
    | Recv Decode.Value
    | PopoverMsg Popover.State
    | PopoverMsgSimilarity Popover.State


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        KeywordInput word ->
            let
                newModel =
                    { model | keyword = word }
            in
            if String.length word >= 2 then
                ( newModel, Cmd.batch [ getSynonyms newModel.keyword ] )

            else
                ( { newModel | userMessage = Dict.empty }, Cmd.none )

        -- SortSynonymsByFreq ->
        --     ( { model | synonyms = List.reverse (List.sortWith compareKeyCandidates model.synonyms) }, Cmd.none )

        SortSynonymsByOrigin ->
            ( { model | synonyms = List.reverse (List.sortBy .metadata model.synonyms) }, Cmd.none )

        SynonymsReady result ->
            case result of
                Ok syns ->
                    ( { model | synonyms = syns, userMessage = Dict.remove "SynonymsReady" model.userMessage }, Cmd.none )

                Err _ ->
                    ( { model | synonyms = [], userMessage = Dict.insert "SynonymsReady" "{{ error_getting_synonyms }}" model.userMessage }, Cmd.none )

        SelectSynonym index ->
            let
                newKeyword =
                    Maybe.withDefault { metadata = "{{ error }}", word = "{{ error }}", freq = [ 0, 0 ] } (getAt index model.synonyms)

                newModel =
                    { model | keyword = newKeyword.word }
            in
            ( newModel, Cmd.batch [ sendMessage (portEncoder newModel), getSynonyms newModel.keyword ] )

        Recv jsonValue ->
            case Decode.decodeValue portDecoder jsonValue of
                Ok value ->
                    let
                        newKeyword =
                            if String.length value.keyword > 0 then
                                value.keyword

                            else
                                model.keyword

                        newModel =
                            { model | keyword = newKeyword }
                    in
                    ( newModel, Cmd.batch [ getSynonyms newModel.keyword ] )

                Err _ ->
                    ( defaultModel, Cmd.none )

        PopoverMsg state ->
            ( { model | popoverState = state }, Cmd.none )

        PopoverMsgSimilarity state ->
            ( { model | popoverStateSimilarity = state }, Cmd.none )


compareKeyCandidates : KeyCandidate -> KeyCandidate -> Order
compareKeyCandidates a b =
    let
        afreq =
            Maybe.withDefault 0 (getAt 0 a.freq)
                + Maybe.withDefault 0 (getAt 1 a.freq)
                + Maybe.withDefault 0 (getAt 2 a.freq)
                + Maybe.withDefault 0 (getAt 3 a.freq)

        bfreq =
            Maybe.withDefault 0 (getAt 0 b.freq)
                + Maybe.withDefault 0 (getAt 1 b.freq)
                + Maybe.withDefault 0 (getAt 2 b.freq)
                + Maybe.withDefault 0 (getAt 3 b.freq)
    in
    case compare afreq bfreq of
        LT ->
            LT

        EQ ->
            EQ

        GT ->
            GT


keyCandidateDecoder : Decode.Decoder KeyCandidate
keyCandidateDecoder =
    Decode.map3 KeyCandidate
        (Decode.field "word" Decode.string)
        (Decode.field "metadata" Decode.string)
        (Decode.field "freq" (Decode.list Decode.int))


synonymsDecoder : Decode.Decoder (List KeyCandidate)
synonymsDecoder =
    Decode.list keyCandidateDecoder


getSynonyms : String -> Cmd Msg
getSynonyms keyword =
    Http.get
        { url = relative [ "api", "synonyms/" ++ keyword ] []
        , expect = Http.expectJson SynonymsReady synonymsDecoder
        }



-- VIEW

calcTotalFrequency : Frequency -> Int
calcTotalFrequency freq =
    ((Maybe.withDefault 0 <| List.Extra.getAt 0 freq) + (Maybe.withDefault 0 <| List.Extra.getAt 1 freq)) // 2


view : Model -> Html Msg
view model =
    render model


renderUserMessages : Dict String String -> Html Msg
renderUserMessages userMessage =
    div [] [ text (String.join "!" (Dict.values userMessage)) ]


renderSingleSynonym : Int -> KeyCandidate -> Html Msg
renderSingleSynonym index synonym =
    div
        [ style "padding" "2px 0"
        , style "display" "flex"
        , class "moonspeak-row"
        , onClick (SelectSynonym index)
        ]
        [
        span
            [ style "flex" "2 1 calc(8rem + 70px)" ]
            [ text synonym.word ]
        , span
            [ style "flex" "1 0 16rem"
            , style "display" "flex"
            , style "justify-content" "space-evenly"
            ]
            [
            span
                [ style "flex" "0 0 4rem"
                , style "text-align" "center"
                ]
                [ text synonym.metadata ]
            , span
                [ style "flex" "0 0 4rem"
                , style "text-align" "right"
                ]
                [ text (String.fromInt <| calcTotalFrequency synonym.freq) ]
            ]
        ]


renderSynonyms : List KeyCandidate -> Html Msg
renderSynonyms synonyms =
    let
        partial =
            lazy2 renderSingleSynonym
    in
    div
        [ ]
        (List.indexedMap partial synonyms)


renderTitleBar : String -> Popover.State -> Popover.State -> Html Msg
renderTitleBar keyword popoverStateSimilarity popoverState =
        div
            [ style "display" "flex" ]
            [ span
                [ style "flex" "1 1 8rem"
                , onClick SortSynonymsByOrigin
                ]
                [ text "{{ title }}" ]
            , span
                [ style "flex" "1 0 70px"
                ]
                [ InputGroup.config
                    (InputGroup.text [
                        Input.placeholder "{{ keyword_placeholder }}"
                        , Input.onInput KeywordInput
                        , Input.value keyword
                        ]
                    )
                    |> InputGroup.small
                    |> InputGroup.view
                ]
            , span
                [ style "flex" "1 0 16rem"
                , style "display" "flex"
                , style "justify-content" "space-evenly"
                ]
                [ label
                    []
                    [ Popover.config
                        ( Button.button
                            [ Button.small
                            , Button.outlineSecondary
                            , Button.attrs <|
                                Popover.onClick popoverStateSimilarity PopoverMsgSimilarity
                            ]
                            [ text ("{{ popularity_column }}")
                            ]
                        )
                        |> Popover.bottom
                        |> Popover.titleH4 [ class "text-secondary" ] [ text "{{ popularity_popover_title }}" ]
                        |> Popover.content []
                            [ text "{{ popularity_popover_explanation }}"
                            ]
                        |> Popover.view popoverStateSimilarity
                    ]
                , label
                    []
                    [ Popover.config
                        ( Button.button
                            [ Button.small
                            , Button.outlineSecondary
                            , Button.attrs <|
                                Popover.onClick popoverState PopoverMsg
                            ]
                            [ text ("{{ total_freq }}")
                            ]
                        )
                        |> Popover.bottom
                        |> Popover.titleH4 [ class "text-secondary" ] [ text "{{ freq_decomposition_title }}" ]
                        |> Popover.content []
                            [ text "{{ freq_decomposition_explanation }}"
                            ]
                        |> Popover.view popoverState
                    ]
                ]
            ]

render : Model -> Html Msg
render model =
    -- Synonyms
    div
        [ style "background-color" "rgb(240, 240, 240)"
        , style "padding" "1rem 1rem"
        ]
        [ lazy3 renderTitleBar model.keyword model.popoverStateSimilarity model.popoverState
        , lazy renderUserMessages model.userMessage
        , lazy2 div [] [ renderSynonyms model.synonyms ]
        ]
